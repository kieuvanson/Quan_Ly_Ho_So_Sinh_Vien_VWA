package vn.vwa.edurecords.dto.response;

public class AuthResponse {
    private UserResponse user;
    private TokenInfo token;

    public AuthResponse() {}

    public AuthResponse(UserResponse user, TokenInfo token) {
        this.user = user;
        this.token = token;
    }

    public static class TokenInfo {
        private String accessToken;
        private String refreshToken;
        private String tokenType;
        private long expiresIn;

        public TokenInfo() {
            this.tokenType = "Bearer";
        }

        public TokenInfo(String accessToken, String refreshToken, long expiresIn) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.tokenType = "Bearer";
            this.expiresIn = expiresIn;
        }

        public String getAccessToken() { return accessToken; }
        public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
        public String getRefreshToken() { return refreshToken; }
        public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
        public String getTokenType() { return tokenType; }
        public void setTokenType(String tokenType) { this.tokenType = tokenType; }
        public long getExpiresIn() { return expiresIn; }
        public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
    }

    public UserResponse getUser() { return user; }
    public void setUser(UserResponse user) { this.user = user; }
    public TokenInfo getToken() { return token; }
    public void setToken(TokenInfo token) { this.token = token; }
}
