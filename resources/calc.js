const input = document.getElementById("finnventorcalc");
input.focus();
const output = document.getElementById("output");
const left_paren = document.getElementById("left_paren");
const right_paren = document.getElementById("right_paren");

var usecookies = false

function calc(x) {
  if (/^\s*$/.test(x.value)) {
    output.innerHTML = "<br/>";
    left_paren.innerHTML = ""
    right_paren.innerHTML =  ""
    input.className = "";
  } else {
    l = x.value.split("(").length-1;
    r = x.value.split(")").length-1;
    left_paren.innerHTML = r-l > 0 ? "(".repeat(r-l) : ""
    right_paren.innerHTML = l-r > 0 ? ")".repeat(l-r) : ""
    try {
      var out = parser.eval(left_paren.innerHTML+x.value+right_paren.innerHTML).toString();
      if (out.length > 99) {
        console.debug(out)
        out = "Function"
      }
      input.className = "";
      output.innerHTML = out;
    } catch (e) {
      input.className = "error";
      console.debug(e);
      try {
        output.innerHTML = math.simplify(left_paren.innerHTML+x.value+right_paren.innerHTML).toString();
      } catch (e) {
        console.debug(e)
      }
    }
  }
}

input.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) { /* enter key */
    event.preventDefault();
    console.log(input.value);
    input.select();
    document.execCommand("insertText", false, "");
    input.value = "";
    input.className = "";
    left_paren.innerHTML = "";
    right_paren.innerHTML = "";
    parser.set("ans", output.innerHTML);
  }
});

var nconfig = {}

function numconfig(number) {
  nconfig = {number: number};

  if (number === "BigNumber") nconfig["precision"] = 35;

  math.config(nconfig);
  calc(input);

  if (usecookies) setCookie("numbertype", number, 999)
}

const aconfig = {
  angles: 'rad'
};

function angleconfig(angles) {
  aconfig.angles = angles;
  calc(input);

  if (usecookies) setCookie("angletype", angles, 999)
}

function setusecookies() {
  usecookies = document.getElementById("usecookies").children[0].checked;
  console.debug("usecookies: %s", usecookies)
  if (usecookies) {
    setCookie("usecookies", "true", 999);
    setCookie("numbertype", nconfig.number, 999);
    setCookie("angletype", aconfig.angles, 999)
  } else {
    delCookie("usecookies");
    delCookie("numbertype");
    delCookie("angletype");
    delCookie("query");
  }
}

document.querySelectorAll('#help a:not([href])').forEach(function(i) {i.href = "?q=" + encodeURI(i.innerHTML)})

window.onload = function() {
  parser = math.parser();
  numconfig("number");

  if (getCookie("usecookies") === "true") {
    document.getElementById("usecookies").MaterialCheckbox.check();
    usecookies = true;

    var c = getCookie("numbertype")
    if (c) document.getElementById("option-"+c).parentElement.MaterialRadio.check()
    var c = getCookie("angletype")
    if (c) {
      document.getElementById("option-"+c).parentElement.MaterialRadio.check()
      aconfig.angles = c
    }
    input.value = getCookie("query")
  }

  let replacements={};const fns1=['sin','cos','tan','sec','cot','csc'];fns1.forEach(function(name){const fn=math[name];const fnNumber=function(x){switch(aconfig.angles){case'deg':return fn(math.eval(x+'/360*2*pi'));case'grad':return fn(math.eval(x+'/400*2*pi'));default:return fn(x);}};replacements[name]=math.typed(name,{'number':fnNumber,'BigNumber':fnNumber,'Fraction':fnNumber,'Array | Matrix':function(x){return math.map(x,fnNumber);}});});const fns2=['asin','acos','atan','atan2','acot','acsc','asec'];fns2.forEach(function(name){const fn=math[name];const fnNumber=function(x){const result=fn(x);if(typeof result==='number'){switch(aconfig.angles){case'deg':return result/2/math.pi*360;case'grad':return result/2/math.pi*400;default:return result;}} return result;};replacements[name]=math.typed(name,{'number':fnNumber,'BigNumber':fnNumber,'Fraction':fnNumber,'Array | Matrix':function(x){return math.map(x,fnNumber);}});});math.import(replacements,{override:true});

  if (window.location.search) {
    var query = window.location.search.match(/[?&]q=([^&]+)/)[1]
    if (query) {
      input.value = decodeURI(query)
    }
  }
  calc(input)

  window.onbeforeunload = function() {
    if (input.value && document.getElementById("usecookies").children[0].checked) {
      setCookie("query", input.value, 99)
    }
  }
};
