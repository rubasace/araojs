@Component
public class WebClientLoggingFilter implements ExchangeFilterFunction {

    @Override
    public Mono<ClientResponse> filter(ClientRequest clientRequest,
                                       ExchangeFunction next) {

        boolean logRequestBody = clientRequest.attribute(LOG_REQUEST_BODY)
                                              .isPresent());
        boolean logResponseBody = clientRequest.attribute(LOG_RESPONSE_BODY)
                                               .isPresent());
        //...
    }
}
