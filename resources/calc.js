const input = document.getElementById("finnventorcalc");
const left_paren = document.getElementById("left_paren");
const right_paren = document.getElementById("right_paren");

var urlquery = ''
if (window.location.search) {
  var match = window.location.search.match(/[?&]q=([^&]+)/)[1]
  if (match) {
    input.value = urlquery = decodeURI(match)
  }
}

var usecookies = false;

/*math.simplify.rules.push(
  {l:"c * v ⹀ n", r:"v ⹀ n / c"} //,"v*c1=c2 -> v=c2/c1", "n1+n3=n2+n3 -> n1=n2"
)*/


var superscript = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-'};

function unsuperscript(text) {
  return '^('+text.split('').map(i=>superscript[i]).join('')+')';
}

function calc(x) {
  var w = 2;
  for (var i of x.value.split("\n")) {
    if (i.length > w) w = i.length;
  }
  x.style.minWidth = Math.max(30, w + 2.5) + 'ch';
  x.style.height = 0;
  x.style.height = x.scrollHeight+5+'px';
  
  var text = x.value.replace(/˖|ᐩ|₊|➕/g, '+').replace(/−|➖|₋|‐|‑|‒|–|—/g, '-').replace(/×|·|⋅|･|•|✕|✖|⨉|⨯/g, '*').replace(/÷|∕|➗|⟌/g, '/').replace(/°/g, ' deg').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, unsuperscript);
  var lparen_all = "";
  var out_all = "";
  var line_n = 0;
  for (var v of text.split('\n')) {
    if (/^\s*$/.test(v)) {
      out_all += "\n"
      lparen_all += "\n";
    } else {
    var i = v.length;
    var c = 0;
    for (var j = 0; j < i; j++) {
      if (v[j] === "(") c++;
      else if (c > 0 && v[j] === ")") c--;
    }
    var rparen = " ";
    if (c > 0) {
      rparen = ")".repeat(c);
      v += rparen;
      rparen = '<span class="paren" onclick="rparen(this, '+line_n+')">'+rparen+' </span>';
    }
    c = 0;
    for (;i--;) {
      if (v[i] === ")") c++;
      else if (c > 0 && v[i] === "(") c--;
    }
    var lparen = "";
    if (c > 0) {
      lparen = "(".repeat(c);
      v = lparen + v;
      lparen = '<span class="paren" onclick="lparen(this, '+line_n+')"> '+lparen+'</span>';
    }
    lparen_all += lparen + "\n";
    var out = ''
    try {
      var out = parser.evaluate('ans='+v).toString();
      if (out.length > 99) {
        console.debug('function='+out);
        out = "  function";
      } else {
        out = "= " + out;
      }
    } catch (e) {
      console.debug(e);
      try {
        out = '<span class="error" title="'+e+'">= '+math.simplify(v).toString()+'</span>';
      } catch (e) {
        out = '<span class="error">'+e+'</span>';
        console.debug(v);
        console.debug(e);
      }
    }
    out_all += rparen + out + "\n";
    }
    line_n++;
  }
  left_paren.innerHTML = lparen_all;
  right_paren.innerHTML = out_all.replace(/\*/g, '×').replace(/ degC/g, ' °C').replace(/ degF/g, ' °F');
}


function nthIndex(str, pat, n){
  var L = str.length;
  var i = -1;
  while(n-- && i++<L) {
    i = str.indexOf(pat, i);
    if (i < 0) break;
  }
  return i;
}


function lparen(span, n) {
  var i = nthIndex(input.value, "\n", n)+1;
  input.focus();
  input.setSelectionRange(i, i);
  document.execCommand('insertText', false, span.innerHTML.trim());
  var i = nthIndex(input.value, "\n", n)+1;
  input.setSelectionRange(i, i);
}

function rparen(span, n) {
  var i = nthIndex(input.value, "\n", n+1);
  input.focus();
  input.setSelectionRange(i, i);
  document.execCommand('insertText', false, span.innerHTML.trim());
}


var nconfig = {}

function numconfig(number) {
  nconfig = {number: number};
  if (number === "BigNumber") nconfig["precision"] = 35;
  math.config(nconfig);
  calc(input);
  if (usecookies) localStorage.setItem("numbertype", number);
}

const aconfig = {
  angles: 'rad'
};

function angleconfig(angles) {
  aconfig.angles = angles;
  calc(input);
  if (usecookies) localStorage.setItem("angletype", angles);
}

function setusecookies() {
  usecookies = document.getElementById("usecookies").children[0].checked;
  console.debug("usecookies: %s", usecookies)
  if (usecookies) {
    localStorage.setItem("usecookies", "true");
    localStorage.setItem("numbertype", nconfig.number);
    localStorage.setItem("angletype", aconfig.angles)
  } else {
    localStorage.clear()
  }
}

document.querySelectorAll('#help a:not([href])').forEach(function(i) {i.href = "?q=" + encodeURI(i.innerHTML)})

function setconstants(parser) {
  parser.evaluate('c=299792458m/s');
  parser.evaluate('k=1.380649e-23J/K');
  parser.evaluate('NA=6.02214076e23/mol');
  parser.evaluate('R=8.31446261815324J/K/mol');
  parser.evaluate('q=1.602176634e-19C');
  parser.evaluate('h=6.62607015e-34J/Hz');
  parser.evaluate('hbar=1.054571817e-34J*s');
  parser.evaluate('e_0=8.8541878128e-12F/m');
  parser.evaluate('mu_0=1.25663706212e-6N/A^2');
  parser.evaluate('k_e=8.9875517923e9N*m^2/C^2');
  parser.evaluate('lorentz(v)=1/sqrt(1-v^2/c^2)');
  parser.evaluate('alorentz(a)=sqrt(1-1/a^2)c');

  parser.set('lewis', '<a href="lewis/">Lewis Dot calculator</a>');
}

window.onload = function() {
  parser = math.parser();
  setconstants(parser);
  numconfig("number");

  if (localStorage.getItem("usecookies") === "true") {
    document.getElementById("usecookies").MaterialCheckbox.check();
    usecookies = true;

    var c = localStorage.getItem("numbertype")
    if (c) document.getElementById("option-"+c).parentElement.MaterialRadio.check()
    var c = localStorage.getItem("angletype")
    if (c) {
      document.getElementById("option-"+c).parentElement.MaterialRadio.check()
      aconfig.angles = c
    }
    if (!input.value) {
      input.value = localStorage.getItem("query")
      input.focus();input.select();
    }
  }

  let replacements={};const fns1=['sin','cos','tan','sec','cot','csc'];fns1.forEach(function(name){const fn=math[name];const fnNumber=function(x){switch(aconfig.angles){case'deg':return fn(math.evaluate(x+'/360*2*pi'));case'grad':return fn(math.evaluate(x+'/400*2*pi'));default:return fn(x);}};replacements[name]=math.typed(name,{'number':fnNumber,'BigNumber':fnNumber,'Fraction':fnNumber,'Array | Matrix':function(x){return math.map(x,fnNumber);}});});const fns2=['asin','acos','atan','atan2','acot','acsc','asec'];fns2.forEach(function(name){const fn=math[name];const fnNumber=function(x){const result=fn(x);if(typeof result==='number'){switch(aconfig.angles){case'deg':return result/2/math.pi*360;case'grad':return result/2/math.pi*400;default:return result;}} return result;};replacements[name]=math.typed(name,{'number':fnNumber,'BigNumber':fnNumber,'Fraction':fnNumber,'Array | Matrix':function(x){return math.map(x,fnNumber);}});});math.import(replacements,{override:true});

  calc(input)

  document.addEventListener('visibilitychange', function() {
    if (input.value && input.value != urlquery && document.getElementById("usecookies").children[0].checked) {
      localStorage.setItem("query", input.value)
    }
  })
};
