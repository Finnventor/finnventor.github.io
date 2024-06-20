const input = document.getElementById("finnventorcalc");
const left_paren = document.getElementById("left_paren");
const right_paren = document.getElementById("right_paren");
const calc_highlight = document.getElementById("calc_highlight");
const sharebutton = document.getElementById("sharebutton");

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


var superscript = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-','⁽':'(','⁾':')'};
var subscript = '₀₁₂₃₄₅₆₇₈₉';

function unsuperscript(text) {
  return '^('+text.split('').map(i=>superscript[i]).join('')+')';
}

function unsubscript(text) {
  return text.split('').map(i=>{var n=subscript.indexOf(i);return n!=-1 ? n : i}).join('');
}

function calc(x) {
  var w = 2;
  for (var i of x.value.split("\n")) {
    if (i.length > w) w = i.length;
  }
  x.style.minWidth = Math.max(30, w + 2.5) + 'ch';
  x.style.height = 0;
  x.style.height = x.scrollHeight+5+'px';
  
  var text = x.value.replace(/˖|ᐩ|₊|➕/g, '+').replace(/−|➖|₋|‐|‑|‒|–|—/g, '-').replace(/×|·|⋅|･|•|✕|✖|⨉|⨯/g, '*').replace(/÷|∕|⁄|➗|⟌/g, '/').replace(/°/g, ' deg').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾]+/g, unsuperscript);
  var lparen_all = "";
  var out_all = "";
  var hl = "";
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
    v = v.replace(/mass\(( *[A-Z].*?)\)/g, function(_,p){c+=2;return'mass("'+p+'")'})
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
      out = '<span class="error material-icons" title="'+e+'">warning</span>';
      try {
        if (e.message.startsWith("Undefined")) {
            invalid = e.message.slice(17);
            out = "= " + math.simplify(v).toString().replace(invalid, '<span class="error" title="'+e+'">'+invalid+'</span>') + "  " + out;
        } else {
            out = "= " + math.simplify(v).toString() + "  " + out;
        }
      } catch (e) {
        if (e.char) {
          hl += ' '.repeat(Math.max(0, e.char-c-1)) + '_';
        }
        console.debug(v);
        console.debug(e);
      }
    }
    out_all += rparen + out + "\n";
    }
    hl += "\n";
    line_n++;
  }
  left_paren.innerHTML = lparen_all;
  right_paren.innerHTML = out_all.replace(/\*/g, '×').replace(/ degC/g, ' °C').replace(/ degF/g, ' °F');
  calc_highlight.innerHTML = hl;
  sharebutton.href = window.location.pathname+'?q='+encodeURI(x.value);
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

function mass(m) {
  var s;
  m = unsubscript(m);
  if (s = m.match(/[^A-Za-z0-9 ]/)) {
    throw new Error('Undefined symbol ' + s);
  }
  var sum = 0;
  for (var e of m.matchAll(/([A-Za-z][a-z]?)([0-9]*)/g)) {
    s = ptable_lowercase[e[1].toLowerCase()];
    if (e[2]) {
      s *= e[2];
    }
    sum += s;
  }
  return math.unit(math.round(sum, 4), 'g/mol');
}

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
  math.import({mass: mass}, {override: true});

  parser.set('lewis', '<a href="lewis/">Lewis Dot calculator</a>');
}

function makeurl() {
  return window.location.href.split('?')[0]+'?q='+encodeURI(input.value);
}

window.onload = function() {
  parser = math.parser();
  setconstants(parser);

  if (localStorage.getItem("usecookies") === "true") {
    document.getElementById("usecookies").MaterialCheckbox.check();
    usecookies = true;

    var c = localStorage.getItem("numbertype")
    if (c) {
      document.getElementById("option-"+c).parentElement.MaterialRadio.check()
      numconfig(c)
    }
    var c = localStorage.getItem("angletype")
    if (c) {
      document.getElementById("option-"+c).parentElement.MaterialRadio.check()
      aconfig.angles = c
    }
    if (!input.value) {
      input.value = localStorage.getItem("query")
      input.focus();input.select();
    }
  } else {
    numconfig("number");
  }

  let replacements={};const fns1=['sin','cos','tan','sec','cot','csc'];fns1.forEach(function(name){const fn=math[name];const fnNumber=function(x){switch(aconfig.angles){case'deg':return fn(math.evaluate(x+'/360*2*pi'));case'grad':return fn(math.evaluate(x+'/400*2*pi'));default:return fn(x);}};replacements[name]=math.typed(name,{'number':fnNumber,'BigNumber':fnNumber,'Fraction':fnNumber,'Array | Matrix':function(x){return math.map(x,fnNumber);}});});const fns2=['asin','acos','atan','atan2','acot','acsc','asec'];fns2.forEach(function(name){const fn=math[name];const fnNumber=function(x){const result=fn(x);if(typeof result==='number'){switch(aconfig.angles){case'deg':return result/2/math.pi*360;case'grad':return result/2/math.pi*400;default:return result;}} return result;};replacements[name]=math.typed(name,{'number':fnNumber,'BigNumber':fnNumber,'Fraction':fnNumber,'Array | Matrix':function(x){return math.map(x,fnNumber);}});});math.import(replacements,{override:true});

  calc(input)

  document.addEventListener('visibilitychange', function() {
    if (input.value && input.value != urlquery && document.getElementById("usecookies").children[0].checked) {
      localStorage.setItem("query", input.value)
    }
  })
};

const ptable_lowercase = {h:1.007944,he:4.0026022,li:6.9412,be:9.0121823,b:10.8117,c:12.01078,n:14.00672,o:15.99943,f:18.99840325,ne:20.17976,na:22.989769282,mg:24.30506,al:26.98153868,si:28.08553,p:30.9737622,s:32.0655,cl:35.4532,ar:39.9481,k:39.09831,ca:40.0784,sc:44.9559126,ti:47.8671,v:50.94151,cr:51.99616,mn:54.9380455,fe:55.8452,co:58.9331955,ni:58.69344,cu:63.5463,zn:65.382,ga:69.7231,ge:72.641,as:74.921602,se:78.963,br:79.9041,kr:83.7982,rb:85.46783,sr:87.621,y:88.905852,zr:91.2242,nb:92.906382,mo:95.962,tc:98,ru:101.072,rh:102.905502,pd:106.421,ag:107.86822,cd:112.4118,in:114.8183,sn:118.7107,sb:121.7601,te:127.603,i:126.904473,xe:131.2936,cs:132.90545192,ba:137.3277,la:138.905477,ce:140.1161,pr:140.907652,nd:144.2423,pm:145,sm:150.362,eu:151.9641,gd:157.253,tb:158.925352,dy:162.5001,ho:164.930322,er:167.2593,tm:168.934212,yb:173.0545,lu:174.96681,hf:178.492,ta:180.947882,w:183.841,re:186.2071,os:190.233,ir:192.2173,pt:195.0849,au:196.9665694,hg:200.592,tl:204.38332,pb:207.21,bi:208.980401,po:209,at:210,rn:222,fr:223,ra:226,ac:227,th:232.038062,pa:231.035882,u:238.028913,np:237,pu:244,am:243,cm:247,bk:247,cf:251,es:252,fm:257,md:258,no:259,lr:262,rf:267,db:268,sg:271,bh:272,hs:270,mt:276,ds:281,rg:280,cn:285,nh:284,fl:289,mc:288,lv:293,ts:294,og:294}
