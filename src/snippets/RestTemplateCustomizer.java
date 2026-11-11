@FunctionalInterface
public interface RestTemplateCustomizer {

    /**
     * Callback to customize a {@link RestTemplate} instance.
     * @param restTemplate the template to customize
     */
    void customize(RestTemplate restTemplate);

}