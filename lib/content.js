var mediaTypeRe = /^\s*([^;]+)/i;
var Validator = require('jsonschema').Validator;
function getMediaType( contentType ) {
    return contentType.match( mediaTypeRe )[0].toLowerCase();
}
 
function getMediaTypeFromSpecReq( specReq ) {
    if( specReq && specReq.headers ) {
        for( var i = 0; i < specReq.headers.length; i++ ) {
            if(/content\-type/i.test( specReq.headers[i].name )) {
                return getMediaType( specReq.headers[i].value );
            }
        }
    }
    return null;
}
 
function getMediaTypeFromHttpReq( httpReq ) {
    if( 'content-type' in httpReq.headers ) {
        return getMediaType( httpReq.headers['content-type'] );
    }
    return null;
}
 
function isBodyEqual( httpReq, specReq, contentType ) {
    if (!specReq && !httpReq.body){
        return true;
    }
 
    if (/json/i.test(contentType)){
       
        var v = new Validator();
        var instance = JSON.parse(httpReq.body);
        var schema = JSON.parse(specReq.body);
        var result = v.validate(instance, schema);
        if (!result.valid) {
            console.log(result);
        }
        return result.valid;
    } else {
        return httpReq.body === specReq.body;
    }
}
 
function hasHeaders( httpReq, specReq, ignoreContentType){
    if (!specReq || !specReq.headers){
        return true;
    }
 
    function containsHeader(header){
        var httpReqHeader = header.name.toLowerCase();
        var requestHeader = httpReq.headers[httpReqHeader];
        var specifiedHeaderName = header.name;
        var specifiedHeader = header.value;
 
        if (ignoreContentType && specifiedHeaderName.toLowerCase() === 'content-type') {
            return true;
        }
 
        console.log('----------request header', requestHeader);
        console.log('----------blueprint header', specifiedHeader);
 
        if(!httpReq.headers.hasOwnProperty( httpReqHeader ) || httpReq.headers[httpReqHeader] !== header.value){
            return false;
        }
 
        return true;
    }
 
    return specReq.headers.every(containsHeader);
}
 
exports.matches = function( httpReq, specReq ) {
    var httpMediaTypesText = getMediaTypeFromHttpReq( httpReq );
    if (httpMediaTypesText) {
        var httpMediaTypes = httpMediaTypesText.split(/\s*;\s*/);
 
        var specMediaType = getMediaTypeFromSpecReq( specReq );
        if (httpMediaTypes.indexOf(specMediaType) === -1 ) {
            console.warn('Skip. Different content-types ', httpMediaTypesText, ' does not contain ', specMediaType );
            return false;
        }
    }
    if ( !hasHeaders( httpReq, specReq, true) ){
        console.warn('Skip. Different headers');
        return false;
    }
 
    if (httpReq.method === 'GET' || isBodyEqual( httpReq, specReq, httpMediaTypesText ) ) {
        return true;
    } else {
        console.warn('Skip. Different body');
        return false;
    } 
};