//WebClient ...

interface RequestHeadersSpec<S extends RequestHeadersSpec<S>> {

    /**
     * Provides access to every attribute declared so far with the
     * possibility to add, replace, or remove values.
     */
    S attributes(Consumer<Map<String, Object>> attributesConsumer);


}
