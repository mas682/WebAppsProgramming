

function makeThing(){
  var newFeature = document.createElement("h3");
  var content = document.createTextNode("This is the new thing");
  newFeature.appendChild(content);
  var elem = document.getElementById("jsparagraph");
  elem.appendChild(newFeature);
}
