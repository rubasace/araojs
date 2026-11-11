@ControllerAdvice
public class DefaultControllerAdvice {

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<String> handle(IllegalArgumentException e) {
        return new ResponseEntity<>("Bad argument!", BAD_REQUEST);
    }

    @ExceptionHandler(NullPointerException.class)
    ResponseEntity<String> handle(NullPointerException e) {
        return new ResponseEntity<>("Unknown Error!", INTERNAL_SERVER_ERROR);
    }
}