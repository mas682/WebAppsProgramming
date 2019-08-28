from flask import Flask, request, session, url_for, redirect, render_template, abort, g, flash
import os

app = Flask(__name__)

# configuration
PER_PAGE = 30
DEBUG = True
SECRET_KEY = 'development key'

SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(app.root_path, 'library.db')
SQLALCHEMY_TRACK_MODIFICATIONS = False

app.config.from_object(__name__)