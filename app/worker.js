onmessage = function(event) {
    let output = {};
    let err = null;
    try{
        let func = new Function( 'sample, output', event.data.funcBody);
        func(event.data.sample, output);
    }
    catch(error){
        err = error.message;
    }
    postMessage({output: output, err : err});
}