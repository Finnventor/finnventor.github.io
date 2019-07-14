var dialog = document.getElementById("pip-dialog");
var dcommand = document.getElementById("pip-command");

function pipdialog(module) {
  dcommand.value = "pip install " + module;

  try {
    dialog.showModal();
  } catch (e) {
    alert("Paste the command 'pip install '"+module+"' into a terminal/command prompt.");
    console.warn("Warning: You are using a browser that does not support the dialog object. Defaulting to alert() message.");
    console.debug(e);
  }
  return false;
}
