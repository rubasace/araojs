@FunctionalInterface
public interface WebClientCustomizer {

    /**
     * Callback to customize a WebClient.Builder instance.
     * @param webClientBuilder the client builder to customize
     */
    void customize(WebClient.Builder webClientBuilder);

}