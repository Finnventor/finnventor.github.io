const input = document.getElementById("finnventorcalc");
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
        console.log(out)
        out = "Function"
      }
      input.className = "";
      output.innerHTML = out;
    } catch (e) {
      input.className = "error";
      console.log(e);
      try {
        output.innerHTML = math.simplify(left_paren.innerHTML+x.value+right_paren.innerHTML).toString();
      } catch (e) {
        console.log(e)
      }
    }
  }
}

input.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) { /* enter key */
    event.preventDefault();
    input.value = "";
    input.className = "";
    left_paren.innerHTML = "";
    right_paren.innerHTML = "";
    parser.set("ans", output.innerHTML);
  }
});

function config(number) {
  dict = {number: number};

  if (number === "BigNumber") dict["precision"] = 35;
  
  math.config(dict);
  calc(input);
}

const aconfig = {
  angles: 'rad'
};

function angleconfig(angles) {
  aconfig.angles = angles;
  calc(input);
}

function setusecookies() {
  usecookies = document.getElementById("usecookies").children[0].checked;
  console.log(usecookies)
  if (usecookies) {
    setCookie("usecookies", "true", 999); 
  } else {
    delCookie("usecookies");
  }
}

window.onload = function() {
  parser = math.parser();
  config("BigNumber");

  if (getCookie("usecookies") === "true") document.getElementById("usecookies").MaterialCheckbox.check();

  let replacements={};const fns1=['sin','cos','tan','sec','cot','csc'];fns1.forEach(function(name){const fn=math[name];const fnNumber=function(x){switch(aconfig.angles){case'deg':return fn(math.eval(x+'/360*2*pi'));case'grad':return fn(math.eval(x+'/400*2*pi'));default:return fn(x);}};replacements[name]=math.typed(name,{'number':fnNumber,'BigNumber':fnNumber,'Fraction':fnNumber,'Array | Matrix':function(x){return math.map(x,fnNumber);}});});const fns2=['asin','acos','atan','atan2','acot','acsc','asec'];fns2.forEach(function(name){const fn=math[name];const fnNumber=function(x){const result=fn(x);if(typeof result==='number'){switch(aconfig.angles){case'deg':return result/2/math.pi*360;case'grad':return result/2/math.pi*400;default:return result;}} return result;};replacements[name]=math.typed(name,{'number':fnNumber,'BigNumber':fnNumber,'Fraction':fnNumber,'Array | Matrix':function(x){return math.map(x,fnNumber);}});});math.import(replacements,{override:true});};