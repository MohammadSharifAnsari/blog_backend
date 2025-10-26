
// Error is an inbuilt class which extends in Apperror

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors=>try this url for more know about errors
class AppError extends Error{
    
constructor(message,statusCode){
    super(message);
this.statusCode=statusCode;
// yeh Error.captureStackTrace(this,this.constructor); stats dega ki kis line me error aai hai

Error.captureStackTrace(this,this.constructor);
}

}
export default AppError;