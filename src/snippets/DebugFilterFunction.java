public class DebugFilterFunction implements ExchangeFilterFunction {

    @Override
    public Mono<ClientResponse> filter(final ClientRequest clientRequest,
                                       final ExchangeFunction next) {
        return Mono.deferContextual(Mono::just)
                   .map(context -> context.get("DEBUG"))
                   //Add header to clientRequest if necessary
                   .flatMap(next::exchange);
    }
}