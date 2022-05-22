const input = document.getElementById("finnventorcalc");
const output = document.getElementById("output");
const left_paren = document.getElementById("left_paren");
const right_paren = document.getElementById("right_paren");

var usecookies = false;

/*math.simplify.rules.push(
  {l:"c * v ⹀ n", r:"v ⹀ n / c"} //,"v*c1=c2 -> v=c2/c1", "n1+n3=n2+n3 -> n1=n2"
)*/

function calc(x) {
  var v = x.value.replace(/˖|ᐩ|⁺|₊|➕/g, '+').replace(/−|➖|⁻|₋|‐|‑|‒|–|—/g, '-').replace(/×|·|⋅|✕|✖|⨉|⨯/g, '*').replace(/÷|∕|➗|⟌/g, '/');
  if (/^\s*$/.test(v)) {
    output.innerHTML = "<br/>";
    left_paren.innerHTML = "";
    right_paren.innerHTML =  "";
    input.className = "";
  } else {
    var i = v.length;
    var c = 0;
    for (var j = 0; j < i; j++) {
      if (v[j] === "(") c++;
      else if (c > 0 && v[j] === ")") c--;
    }
    right_paren.innerHTML = c > 0 ? ")".repeat(c) : "";
    c = 0;
    for (;i--;) {
      if (v[i] === ")") c++;
      else if (c > 0 && v[i] === "(") c--;
    }
    left_paren.innerHTML = c > 0 ? "(".repeat(c) : "";
    try {
      var out = parser.evaluate(left_paren.innerHTML+v+right_paren.innerHTML).toString();
      if (out.length > 99) {
        console.debug(out);
        out = "Function";
      }
      input.className = "";
    } catch (e) {
      input.className = "error";
      console.debug(e);
      try {
        out = math.simplify(left_paren.innerHTML+v+right_paren.innerHTML).toString();
      } catch (e) {
        console.debug(e);
        return;
      }
    }
    output.innerHTML = out.replace(/\*/g, '×');
  }
}

input.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) { /* enter key */
    event.preventDefault();
    if (input.value === "lewis") {
      window.location.href="lewis/";
      return;
    }
    console.log(input.value);
    var o = output.innerHTML;
    parser.set("ans", o);
    input.select();
    document.execCommand("insertText", false, "");
    input.value = "";
    input.className = "";
    left_paren.innerHTML = "";
    right_paren.innerHTML = "";
    output.innerHTML = o;
  }
});

var nconfig = {}

function numconfig(number) {
  nconfig = {number: number};
  if (number === "BigNumber") nconfig["precision"] = 35;
  math.config(nconfig);
  calc(input);
  if (usecookies) setCookie("numbertype", number, 999);
}

const aconfig = {
  angles: 'rad'
};

function angleconfig(angles) {
  aconfig.angles = angles;
  calc(input);
  if (usecookies) setCookie("angletype", angles, 999);
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

function setconstants(parser) {
  parser.evaluate('c=299792458m/s');
  parser.evaluate('k=1.380649e-23J/K');
  parser.evaluate('NA=6.02214076e23/mol');
  parser.evaluate('q=1.602176634e19C');
  parser.evaluate('h=6.62607015e-34J/Hz');
  parser.evaluate('hbar=1.054571817e-34J*s');
  parser.evaluate('lorentz(v)=1/sqrt(1-v^2/c^2)');
  parser.evaluate('alorentz(a)=sqrt(1-1/a^2)c');

  parser.set('lewis', '<a href="lewis/">Lewis Dot calculator</a>');
}

window.onload = function() {
  parser = math.parser();
  setconstants(parser);
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
    input.focus();input.select();
  }

  let replacements={};const fns1=['sin','cos','tan','sec','cot','csc'];fns1.forEach(function(name){const fn=math[name];const fnNumber=function(x){switch(aconfig.angles){case'deg':return fn(math.evaluate(x+'/360*2*pi'));case'grad':return fn(math.evaluate(x+'/400*2*pi'));default:return fn(x);}};replacements[name]=math.typed(name,{'number':fnNumber,'BigNumber':fnNumber,'Fraction':fnNumber,'Array | Matrix':function(x){return math.map(x,fnNumber);}});});const fns2=['asin','acos','atan','atan2','acot','acsc','asec'];fns2.forEach(function(name){const fn=math[name];const fnNumber=function(x){const result=fn(x);if(typeof result==='number'){switch(aconfig.angles){case'deg':return result/2/math.pi*360;case'grad':return result/2/math.pi*400;default:return result;}} return result;};replacements[name]=math.typed(name,{'number':fnNumber,'BigNumber':fnNumber,'Fraction':fnNumber,'Array | Matrix':function(x){return math.map(x,fnNumber);}});});math.import(replacements,{override:true});

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
