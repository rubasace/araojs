@Component
public class DebugWebFilter implements WebFilter {

    @Override
    public Mono<Void> filter(final ServerWebExchange exchange,
                             final WebFilterChain chain) {
        return chain.filter(exchange)
                    .contextWrite(addDebug(exchange.getRequest()));
    }

}