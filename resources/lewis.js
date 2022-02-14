var element_dict = {"H":1,"He":2,"Li":1,"Be":2,"B":3,"C":4,"N":5,"O":6,"F":7,"Ne":8,"Na":1,"Mg":2,"Al":3,"Si":4,"P":5,"S":6,"Cl":7,"Ar":8,"K":1,"Ca":2,"Ga":3,"Ge":4,"As":5,"Se":6,"Br":7,"Kr":8,"Rb":1,"Sr":2,"In":3,"Sn":4,"Sb":5,"Te":6,"I":7,"Xe":8,"Cs":1,"Ba":2,"Tl":3,"Pb":4,"Bi":5,"Po":6,"At":7,"Rn":8,"Fr":1,"Ra":2,"Nh":3,"Fl":4,"Mc":5,"Lv":6,"Ts":7,"Og":8};

var element_table = document.getElementById("element_table");
var bond_table = document.getElementById("bond_table");
var molecule_charge = document.getElementById("molecule_charge");


function size_textarea(t) {
  var w = 0;
  for (var i of t.value.split("\n")) {
    if (i.length > w) w = i.length;
  }
  t.style.width = w + 3 + 'ch';
  t.style.height = 0;
  t.style.height = t.scrollHeight+'px';
}

function molcalc(inp) {
  size_textarea(inp);

  text = "<tr><th>Element</th><th>Valence<br>Electrons</th><th>Count</th></tr>"
  var m = new Map()
  for (var i of inp.value.match(/[A-Za-z]+/g) || []) {
    m.set(i, 1 + (m.get(i) || 0));
  }
  var n_electrons = 0;
  var n_elements = 0;
  for (var [k, v] of m) {
    n_elements += v;
    var n = element_dict[k];
    text += "<tr"
    if (n) n_electrons += v*n;
    else text += ' class="error"'
    text += "><th>"+k+"</th><td>"+(n || "?")+"</td><td>"+v+"</td></tr>";
  }
  element_table.innerHTML = text + "<tr><th>Total</th><td>"+n_electrons+"</td><td>"+n_elements+"</td></tr>"

  var m = {}
  for (var i of inp.value) {
    m[i] = 1 + (m[i] || 0);
  }
  var n_bond_electrons = 0;
  var n_bonds = 0;
  for (var i of bond_table.children[0].children) {
    if (i.children[2].nodeName == "TD") {
      if (i.children[0].innerHTML == "Total") {
        i.children[1].innerHTML = n_bond_electrons;
        i.children[2].innerHTML = n_bonds;
      } else {
        var n = m[i.children[0].innerHTML];
        if (n) {
          n_bonds += i.children[2].innerHTML = n;
          n_bond_electrons += n * i.children[1].innerHTML;
          i.className = "";
        } else {
          i.children[2].innerHTML = 0;
          i.className = "empty";
        }
      }
    }
  }
  var charge = n_electrons - n_bond_electrons;
  if (charge < 0) {
    molecule_charge.className = "negative";
  } else if (charge > 0) {
    molecule_charge.className = "positive";
    charge = "+" + charge;
  } else {
    molecule_charge.className = "";
  }
  molecule_charge.innerHTML = charge;
}

function indent(b) {
  var x = b.parentNode.previousElementSibling;
  x.value = x.value.replace(/^/gm,  " ");
  size_textarea(x);
}

function unindent(b) {
  var x = b.parentNode.previousElementSibling;
  x.value = x.value.replace(/^ /gm,  "");
  size_textarea(x);
}

var mol_inp = document.getElementById("finnventormolecule");

function cyclohexane() {
  mol_inp.value = ` H  H   H  H
  \\ |   | /
H   C - C   H
 \\ /     \\ /
  C       C
 / \\     / \\
H   C - C   H
  / |   | \\
 H  H   H  H`;
  molcalc(mol_inp);
}

function CO2() {
  mol_inp.value = "::O=C=O::";
  molcalc(mol_inp);
}

function H2SO4() {
  mol_inp.value = `    H
    |
   :O:
    |
::O=S=O::
    |
   :O:
    |
    H`;
  molcalc(mol_inp);
}

function Na() {
  mol_inp.value = "Na";
  molcalc(mol_inp);
}

function Cl() {
  mol_inp.value=` ..
:Cl:
 ''`;
  molcalc(mol_inp);
}

function NaCl() {
  mol_inp.value=`      ..
 Na  :Cl:  Na
      ''
 ..        ..
:Cl:  Na  :Cl:
 ''        ''`;
  molcalc(mol_inp);
}

function N2() {
  mol_inp.value = ":N\u2261N:";
  molcalc(mol_inp);
}

window.addEventListener('load', function() {molcalc(document.getElementById("finnventormolecule"));});
