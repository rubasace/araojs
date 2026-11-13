public class DebugFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        boolean isDebug = "true".equals(req.getParameter("debug"));
        if (isDebug) {
            MDC.put("debug", "true");
        }
        try {
            chain.doFilter(req, res);
        } finally {
            MDC.remove("debug");
        }
    }
}
