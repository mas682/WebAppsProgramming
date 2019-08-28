from flask import Flask, request, session, url_for, redirect, render_template, abort, g, flash
from app import *
from models import db, User, Book

#########################################################################################
# Utilities
#########################################################################################

# Given a username, gives
def get_user_id(username):
	rv = User.query.filter_by(username=username).first()
	return rv.user_id if rv else None

def get_book_id(book, author):
	rv = Book.query.filter_by(title=book).first()
	return rv.author == author if rv else None

# This decorator will cause this function to run at the beginning of each request,
# before any of the route functions run. We're using this to check if the user is
# logged in, so that we don't have to do that on every page.
@app.before_request
def before_request():
	# 'g' is a general-purpose global variable thing that Flask gives you.
	# it's a "magic global" like session, request etc. so it's useful
	# for storing globals that you only want to exist for one request.
	g.user = None
	if 'user_id' in session:
		g.user = User.query.filter_by(user_id=session['user_id']).first()

#########################################################################################
# User account management page routes
#########################################################################################

# This stuff is taken pretty much directly from the "minitwit" example.
# It's pretty standard stuff, so... I'm not gonna make you reimplement it.

@app.route('/login', methods=['GET', 'POST'])
def login():
	"""Logs the user in."""
	if g.user:
		return redirect(url_for('home'))
	error = None
	if request.method == 'POST':

		user = User.query.filter_by(username=request.form['username']).first()
		if user is None:
			error = 'Invalid username'
		elif user.password != request.form['password']:
			error = 'Invalid password'
		else:
			flash('You were logged in')
			session['user_id'] = user.user_id
			return redirect(url_for('home'))

	return render_template('login.html', error=error)

@app.route('/register', methods=['GET', 'POST'])
def register():
	"""Registers the user."""
	if g.user:
		return redirect(url_for('home'))

	error = None
	if request.method == 'POST':
		if not request.form['username']:
			error = 'You have to enter a username'
		elif not request.form['email'] or '@' not in request.form['email']:
			error = 'You have to enter a valid email address'
		elif not request.form['password']:
			error = 'You have to enter a password'
		elif request.form['password'] != request.form['password2']:
			error = 'The two passwords do not match'
		elif get_user_id(request.form['username']) is not None:
			error = 'The username is already taken'
		else:
			db.session.add(User(
				username = request.form['username'],
				email = request.form['email'],
				password = request.form['password'],
				librarian = False))
			db.session.commit()
			flash('You were successfully registered! Please log in.')
			return redirect(url_for('login'))

	return render_template('register.html', error=error)

@app.route('/logout')
def logout():
	"""Logs the user out."""
	flash('You were logged out. Thanks!')
	session.pop('user_id', None)
	return redirect(url_for('home'))

#########################################################################################
# Other page routes
#########################################################################################

@app.route('/register_librarian', methods=['GET', 'POST'])
def register_librarian():
	"""Registers the Librarian."""
	error = None
	if request.method == 'POST':
		if not request.form['username']:
			error = 'You have to enter a username'
		elif not request.form['email'] or '@' not in request.form['email']:
			error = 'You have to enter a valid email address'
		elif not request.form['password']:
			error = 'You have to enter a password'
		elif request.form['password'] != request.form['password2']:
			error = 'The two passwords do not match'
		elif get_user_id(request.form['username']) is not None:
			error = 'The username is already taken'
		else:
			db.session.add(User(
				username = request.form['username'],
				email = request.form['email'],
				password = request.form['password'],
				librarian = True))
			db.session.commit()
			flash('You registered a new librarian!')
			return redirect(url_for('home'))

	return render_template('reg_lib.html', error=error)

@app.route('/books/', methods=['GET', 'POST'])
@app.route('/books/<book_id>', methods=['GET', 'POST'])
#def books(book_id=None):
def books(book_id = None):
	if not g.user.librarian:
		return redirect(url_for('home'))
	elif request.method == 'POST' and book_id is not None:
		book = request.form.get('book_remove')
		remove_book = Book.query.filter_by(book_id = book).first()
		if remove_book is None:
			return abort(404)
		removed_title = remove_book.title
		db.session.delete(remove_book)
		db.session.commit()
		flash("The book with the title \"" + str(removed_title) + "\" has been removed")
		return redirect(url_for('home'))
	elif book_id is None:
		error = None
		if request.method == 'POST':
			if not request.form['title']:
				error = 'You have to enter a Title'
			elif not request.form['author']:
				error = 'You have to enter a Authors'
			elif not request.form['book_id']:
				error = 'You have to enter a book ID'
			elif get_book_id(request.form['title'], request.form['author']) is not None:
				error = 'A book with this title and author already exists'
			else:
				db.session.add(Book(
					title = request.form['title'],
					author = request.form['author'],
					book_id = request.form['book_id'],))
				db.session.commit()
				flash('You registered a new book!')
				return redirect(url_for('home'))
		return render_template('reg_book.html', error=error)
	else:
		book = Book.query.filter_by(book_id=book_id).first()
		if book is None:
			abort(404)
		else:
			borrowers = book.borrowed_by
			borrowers_exist = False
			if borrowers is None or borrowers.count() > 0:
				borrowers_exist = True
		return render_template('book.html', book = book,borrowers =  borrowers, borrowers_exist = borrowers_exist)


@app.route('/accounts/', methods=['GET', 'POST'])
@app.route('/accounts/<id_num>', methods=['GET', 'POST'])
def user_list(id_num = None):
	if not g.user.librarian:
		return redirect(url_for('home'))
	elif request.method == 'POST' and id_num is not None:
		name = request.form.get('remove_user')
		removed_user = User.query.filter_by(user_id = name).first()
		if removed_user is None:
			return abort(404)
		removed_title = removed_user.username
		db.session.delete(removed_user)
		db.session.commit()
		flash("The user with the name \"" + str(removed_title) + "\" has been removed")
		return redirect(url_for('home'))
	elif id_num is None:
		error = None
		users = User.query.filter_by(librarian = False).order_by(User.username).all()
		if users is None:
			flash("NONE")
		librarians = User.query.filter_by(librarian = True).order_by(User.username).all()
		if request.method == 'POST':
			"""Registers the Librarian."""
			error = None
			if request.method == 'POST':
				if not request.form['username']:
					error = 'You have to enter a username'
				elif not request.form['email'] or '@' not in request.form['email']:
					error = 'You have to enter a valid email address'
				elif not request.form['password']:
					error = 'You have to enter a password'
				elif request.form['password'] != request.form['password2']:
					error = 'The two passwords do not match'
				elif get_user_id(request.form['username']) is not None:
					error = 'The username is already taken'
				else:
					db.session.add(User(
					username = request.form['username'],
					email = request.form['email'],
					password = request.form['password'],
					librarian = True))
					db.session.commit()
					flash('You registered a new librarian!')
					return redirect(url_for('home'))
				# needs fixed..
				return render_template('user_list.html', error=error, users = users, librarians = librarians)
		return render_template('user_list.html', error=error, users = users, librarians = librarians)
	else:
		user = User.query.filter_by(user_id=id_num).first()
		borrowed_num = False
		owner = False
		if user is None:
			abort(404)
		else:
			borrowed = user.borrows
			if borrowed.count() > 0 and not borrowed is None:
				borrowed_num = True
			if user.username == 'owner':
				owner = True
		return render_template('user.html', user = user,borrowed =  borrowed, bool = borrowed_num, owner = owner)


# The home page shows a listing of books.
@app.route('/', methods=['GET', 'POST'])
def home():
	if request.method == 'POST':
		error = None
		if g.user is None:
			flash("no user")
			flash(error)
			return render_template('home.html', book_list = books)
		else:
			book = Book.query.filter_by(book_id=request.form.get('book_id')).first()
			if book is None:
				error = "No book found"
				flash(error)
				return redirect(url_for('home'))
			borrowers = book.borrowed_by.filter_by(username = g.user.username)
			book_user = User()
			if borrowers is None or borrowers.count() == 0:
				g.user.borrows.append(book)
				borrowers = book.borrowed_by.filter_by(username = g.user.username)
				error = "You have now borrowed the book"
			else:
				book_user = borrowers.first()
				error = borrowers.count()
				user_found = False
				if book_user.username == g.user.username:
					error = "You have returned the book"
					user_found = True
					g.user.borrows.remove(book)
				else:
					error = "You have now borrowed the book"
					user_found = False
					g.user.borrows.append(book)
			db.session.commit() 
			flash(error)
			return redirect(url_for('home'))

	if g.user:
		borrowed = User.query.filter_by(username = g.user.username).first().borrows.order_by(Book.title).all()
	books = Book.query.order_by(Book.title).all()
	borrowed_arr = []
	borrowers = None
	if g.user:
		for book in books:
			borrowers = book.borrowed_by.filter_by(username = g.user.username)
			#if borrowers is None or borrowers.count() == 0:
			#	g.user.borrows.append(book)
			#	borrowers = book.borrowed_by.filter_by(username = g.user.username)
			#	error = "You have now borrowed the book"
			found = False
			for b in borrowed:
				if(book.title == b.title):
					borrowed_arr.append(1)
					found = True
					break
			if not found:
				borrowed_arr.append(0)

	return render_template('home.html', book_list = books, borrowed = borrowed_arr)
