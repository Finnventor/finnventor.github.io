var dialog = document.getElementById("pip-dialog")
var dcommand = document.getElementById("pip-command")

function pipdialog(module) {
  dcommand.value = "pip install " + module

  dialog.showModal()
}