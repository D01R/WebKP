class ApiError extends Error{
    constructor(status, message){
        super();
        this.status = status;
        this.message = message;
    }

    static badRequest(message){
        return new ApiError(404, message);
    }

    static internal(message){
        return new ApiError(500, message);
    }

    static forbidden(message){
        return new ApiError(403, message);
    }

    static noAuth(){
        return new ApiError(401, "The user is not logged in");
    }

    static unexpectedError() {
        return new ApiError(500, "Unexpected error");
    }
}

module.exports = ApiError;