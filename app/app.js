// editor init
let editor = ace.edit("editor");
editor.setTheme("ace/theme/twilight");
editor.getSession().setMode("ace/mode/javascript");
document.getElementById('editor').style.fontSize='20px';
editor.setValue(`function (sample, output) {
    //user custom code here
}`);

// UI init
let userInput = document.getElementById('user-input');
let errorsOutput = document.getElementById('errors-output');
let resultOutput = document.getElementById('result-output');

//main
let timerId;
let worker;

let inputStream = Rx.Observable.fromEvent(userInput, 'input');
let requestStream1 = inputStream.map(function(){});
let editorStream = Rx.Observable.create(function(observer){
    editor.on('change', function(e) {
        observer.next();
    });    
});
let requestStream2 = editorStream.map(function(){});
let requestStreamAll = Rx.Observable.merge(
  requestStream1, requestStream2
);
const subscribe = requestStreamAll.subscribe(function(){
    showErrorMessage("");
    evaluateExpression();
});


function evaluateExpression() {
    if(timerId)
        clearTimeout(timerId);
    if(worker) {
        worker.terminate();
        worker = null;    
    }
    let output={};
    let sample = userInput.value;
    let funcBody = parseEditorValue(editor.getValue());
    
    //worker init
    worker = new Worker("worker.js");
    worker.onmessage = receivedWorkerMessage;
    worker.onerror = workerError;
    resultOutput.innerHTML = "Calculating...";
    worker.postMessage({funcBody: funcBody, sample: sample});
    timerId = setTimeout(function(){
        worker.terminate();
        worker = null;
        showErrorMessage("To long calculating... aborted!");
    }, 3000);
} 

function parseEditorValue(value) {
    if (value.indexOf('function (sample, output) {') == -1 ||  value.lastIndexOf('}') == -1) {
        showErrorMessage("Syntaxis error in main function");
        return "";
    } 
    return value.substring(value.indexOf('{')+1, value.lastIndexOf('}')); 
}

function showErrorMessage(value) {
    errorsOutput.innerHTML = value;
    resultOutput.innerHTML="";
}

function receivedWorkerMessage(event) {
    clearTimeout(timerId);
    if(event.data.output)
        resultOutput.innerHTML = JSON.stringify(event.data.output);
    if(event.data.err)
        showErrorMessage(event.data.err);
}

function workerError(error) {
    clearTimeout(timerId);
    showErrorMessage(error.message)
    resultOutput.innerHTML="";
 }