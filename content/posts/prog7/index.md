+++
date = '2021-12-20T14:55:50+03:00'
draft = false
title = 'Лабораторная работа: Реализация OAuth 2.0 + OpenID Connect с использованием Spring Boot, JWT и Redis'
+++

> Выполнил Шардт М.А., 4об_ИВТ-1/21

В данной работе будет реализована работа сервера авторизации, сервера ресурсов и сервера клиента по OAuth 2.

Перед началом работы нужно внести доменные имена серверов в /etc/hosts. Можно выбрать любые доменные имена, в данной работе у всех серверов будет одинаковый префикс `wewe`.

```
127.0.0.1 wewe-client
127.0.0.1 wewe-auth
127.0.0.1 wewe-resource
```

> В дальнейшем это также может помочь с настройкой Docker. Docker использует названия контейнеров как их доменные имена, используя внутренний DNS для их адресации. Если при разработке и при деплое будут использоваться одинаковые доменные имена не нужно будет менять конфигурацию самих серверов.

> В проектах файлы настройки разделены на разные профили: application.yaml, application-dev.yaml и application-prod.yaml. Это помогает разделить настройку приложения для разработки и для продакшн.

## Сервер авторизации

Для создания Spring Authorization Server нужно поставить следующую зависимость:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-authorization-server</artifactId>
</dependency>
```

Напишем класс конфигурации сервера.


```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /* (1) */
//    @Bean
//    @Order(1)
//    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http)
//            throws Exception {
//        OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);
//        http.getConfigurer(OAuth2AuthorizationServerConfigurer.class)
//                        .oidc(Customizer.withDefaults());
//
//        http
//                .exceptionHandling((exceptions) -> exceptions
//                        .defaultAuthenticationEntryPointFor(
//                                new LoginUrlAuthenticationEntryPoint("/login"),
//                                new MediaTypeRequestMatcher(MediaType.TEXT_HTML)
//                        )
//                );
//
//        return http.build();
//    }
//
//    @Bean
//    @Order(2)
//    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http)
//            throws Exception {
//        http
//                .authorizeHttpRequests((authorize) -> authorize
//                        .anyRequest().authenticated()
//                )
//                .formLogin(Customizer.withDefaults());
//
//        return http.build();
//    }

    /* (2) */
    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails userDetails = User.withUsername("user")
                .password("password")
                .roles("USER")
                .build();

        return new InMemoryUserDetailsManager(userDetails);
    }

    /* (3) */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }

    /* (4) */
    @Bean
    public RegisteredClientRepository registeredClientRepository() {
        RegisteredClient weweClient = RegisteredClient.withId(UUID.randomUUID().toString())
                .clientId("wewe-client")
                .clientSecret("{noop}secret")
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantTypes(auth -> {
                    auth.add(AuthorizationGrantType.AUTHORIZATION_CODE);
                    auth.add(AuthorizationGrantType.REFRESH_TOKEN);
                    auth.add(AuthorizationGrantType.CLIENT_CREDENTIALS);
                })
                .redirectUri("http://wewe-client:8080/login/oauth2/code/wewe-client")
                .scope(OidcScopes.OPENID)
                .scope(OidcScopes.PROFILE)
                .scope("read")
                .clientSettings(
                        ClientSettings.builder()
                                .requireAuthorizationConsent(true)
                                .requireProofKey(true)
                                .build())
                .build();

        return new InMemoryRegisteredClientRepository(weweClient);
    }

}

```

1. Изменение поведения запросов обработки происходит через бин `SecurityFilterChain authorizationServerFilterChain(HttpSecurity http)` и `SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http)`. В данной работе будем пользоваться стандартной конфигурацией, закомментированный код приведен как пример такой кастомизации.
2. Добавляем пользователей, представляя реализацию `UserDetailsService`. Изначально будем пользоваться `InMemoryUserDetailsManager`, но позднее напишем собственную реализацию, чтобы загружать пользователей из redis.
3. Настроим основного клиента `wewe-client`. Это будет наш сервер клиента.
4. Также нужно определить `PasswordEncoder`. В рамках работы не будем пользоваться шифрованием паролей.

## Сервер ресурсов

Установим следующие зависимости:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```


```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /* (1) */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests((authorize) -> authorize
                        // Обязательно префикс "SCOPE_", иначе не работает.
                        .requestMatchers("/secrets").hasAuthority("SCOPE_read")
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer((oauth2) -> oauth2
                        .jwt(Customizer.withDefaults())
                );
        return http.build();
    }

}
```

1. Настроим бин `SecurityFilterChain securityFilterChain(HttpScurity http)`. Все запросы должны быть авторизированными, а по пути /secrets иметь права для чтения (SCOPE_read).

```java
/* (2) */
@RestController
@RequestMapping(value = "/secrets")
public class SecretsController {

    @GetMapping()
    public String getSecret() {
        return "this is a well-kept secret";
    }

}
```

2. Настроим REST контроллер для выдачи серетной информации. Секретом будет обычная строка.

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: http://wewe-auth:9001/oauth2/jwks
```

3. Для корректной связи с сервером авторизации в настройках пропишем `jwk-set-uri`.

## Сервер клиент

Установим следующие зависимости:

```xml
 <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```


```java
/* (1) */
@Configuration
public class WebClientConfig {

    @Bean
    WebClient webClient(OAuth2AuthorizedClientManager authorizedClientManager) {
        ServletOAuth2AuthorizedClientExchangeFilterFunction oauthClient =
                new ServletOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager);
        return WebClient.builder()
                .apply(oauthClient.oauth2Configuration())
                .build();
    }

    @Bean
    OAuth2AuthorizedClientManager authorizedClientManager(
            ClientRegistrationRepository clientRegistrationRepository,
            OAuth2AuthorizedClientRepository authorizedClientRepository) {
        OAuth2AuthorizedClientProvider authorizedClientProvider = OAuth2AuthorizedClientProviderBuilder.builder()
                .authorizationCode()
                .clientCredentials()
                .build();
        DefaultOAuth2AuthorizedClientManager authorizedClientManager = new DefaultOAuth2AuthorizedClientManager(
                clientRegistrationRepository, authorizedClientRepository
        );
        authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider);
        return authorizedClientManager;
    }

}
```

1. Настройка `WebClient` для работы по OAuth 2.

```java
/* (2) */
@RestController
public class ResourceServerSecretsController {

    private final WebClient webClient;
    private final String resourceServerBaseUri;

    public ResourceServerSecretsController(WebClient webClient,
                                           @Value("${resourceServer.baseUri}") String messagesBaseUri) {
        this.webClient = webClient;
        this.resourceServerBaseUri = messagesBaseUri;
    }

    /* (3) */
    @GetMapping(value = "/secrets", params = "grant_type=client_credentials")
    public String getSecretsWithClientCredentials() {
        return this.webClient
                .get()
                .uri(this.resourceServerBaseUri)
                .attributes(clientRegistrationId("wewe-client-client-credentials"))
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    /* (4) */
    @GetMapping("/secrets")
    public String getSecretsWithAuthorizationCode() {
        return webClient
                .get()
                .uri(this.resourceServerBaseUri)
                .attributes(clientRegistrationId("wewe-client-authorization-code"))
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

}
```

2. Контроллер для получения доступа к ресурсам пользователями. Запросы по пути /secrets будут получать данные с сервера ресурсов и выдавать их пользователю после авторизации.
3. При передаче параметра `grant_type=client_credentials` клиент будет проводить авторизацию по Client Credentials Flow, отправляя client_secret, чтобы получить токен доступа, т.е. не требуя авторизации от пользователя.
4. Без передачи данного параметра работает Authorization Code Flow, который, в свою очередь, требует авторизации от пользователя.


```java
@Configuration
public class AuthorazationRequestResolverConfig {

    /* (5) */
    @Bean
    public OAuth2AuthorizationRequestResolver pkceResolver(ClientRegistrationRepository clientRegistrationRepository) {
        DefaultOAuth2AuthorizationRequestResolver resolver =
                new DefaultOAuth2AuthorizationRequestResolver(
                        clientRegistrationRepository,
                        OAuth2AuthorizationRequestRedirectFilter.DEFAULT_AUTHORIZATION_REQUEST_BASE_URI);

        /* (6) */
        resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
        return resolver;
    }

}

```
5. Так как на сервере настроена проверка по PKCE, то настроим ее и на клиенте. Для этого нужно определить бин `OAuth2AuthorizationRequestResolver`
6. и добавить в него PKCE.

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    OAuth2AuthorizationRequestResolver authorizationRequestResolver;

    public SecurityConfig(OAuth2AuthorizationRequestResolver authorizationRequestResolver) {
        this.authorizationRequestResolver = authorizationRequestResolver;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> {
                    // Запросы к серверу ресурсов по Authorization Code Flow
                    //      автоматически требуют авторизации у сервера авторизации.
//                   auth.requestMatchers("/secured").authenticated();
                    auth.anyRequest().permitAll();
                })
                .oauth2Login(auth -> auth
                        .authorizationEndpoint(authEndpoint -> authEndpoint
                                /* (7) */
                                .authorizationRequestResolver(authorizationRequestResolver)
                        ));
        return http.build();
    }

}
```

7. и использовать указать его как основной резолвер для запросов авторизации в `SecurityFilterChain`.

И занесем параметры сервера авторизации и сервера ресурсов в application.yaml:

```yaml
resourceServer:
  baseUri: http://wewe-resource:9002/secrets

secrets:
  client-secret: ${CLIENT_SECRET}

spring:
  security:
    oauth2:
      client:
        registration:
          # ()
          wewe-client-authorization-code:
            client-id: wewe-client
            client-secret: ${secrets.client-secret}
            client-authentication-method: client_secret_basic
            authorization-grant-type: authorization_code
            redirect-uri: "{baseUrl}/login/oauth2/code/wewe-client"
            scope:
              - openid
              - profile
              - read
            client-name: "Wewe Auth"
            provider: wewe-auth
          # (2)
          wewe-client-client-credentials:
            client-id: wewe-client
            client-secret: ${secrets.client-secret}
            client-authentication-method: client_secret_basic
            authorization-grant-type: client_credentials
            redirect-uri: "{baseUrl}/login/oauth2/code/wewe-client"
            scope:
              - openid
              - profile
              - read
            client-name: "Wewe Auth Client Credentials"
            provider: wewe-auth
        provider:
          wewe-auth:
            issuer-uri: "http://wewe-auth:9001"
            authorization-uri: "http://wewe-auth:9001/oauth2/authorize"
            token-uri: "http://wewe-auth:9001/oauth2/token"
            jwk-set-uri: "http://wewe-auth:9001/oauth2/jwks"
```

Здесь определены два flow:
1. wewe-client-authorization-code -- Authorization Flow.
2. wewe-client-client-credentials -- Client Secret Flow.

## Redis

Redis будем использовать для сохранения следующей информации на сервере авторизации:
- Сессии и куки.
- Информация о клиентах.
- Информация о пользователях.

Укажем redis в качестве зависимости для сервера авторизации:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

и укажем подключение в application.yaml

```yaml
redis:
  host: redis # или localhost, если не вносить redis в /etc/hosts
  port: 6379
```

### Сессии и куки

Для настройки redis как хранилища сессий и куки, все достаточно просто. Нужно указать следующие зависимости:

```
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.session</groupId>
    <artifactId>spring-session-data-redis</artifactId>
    <version>3.4.0</version>
</dependency>
```

И указать в application.yaml, что информация о сессиях должна храниться в redis:
```yaml
spring:
  session:
    store-type: redis
```

Profit!

### Информация о клиентах

Настройка подключения к redis будет происходить следующим образом:

```java
@EnableRedisRepositories("com.mxschardt.oauth.auth.repository")
@Configuration(proxyBeanMethods = false)
public class RedisConfig {

    @Value("${redis.host}")
    private String redisHost;

    @Value("${redis.port}")
    private int redisPort;

    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration configuration = new RedisStandaloneConfiguration(redisHost, redisPort);

        return new LettuceConnectionFactory(configuration);
    }

}
```

В Spring за хранение информации о клиентах отвечает интерфейс `RegisteredClientRepository`.
При настройке сервера авторизации, мы сохраняли клиентов в `InMemoryRegisteredClientRepository`, который имплементируют методы `RegisteredClientRepository`.
Нам же нужно предоставить свою реализацию.

Начнем с класса entity, который будет сохранять информацию об одном клиенте:

```java
@RedisHash("oauth2_registered_client")
public class OAuth2RegisteredClient {

    @Id
    private final String id;

    @Indexed
    private final String clientId;

    private final Instant clientIdIssuedAt;

    private final String clientSecret;

    private final Instant clientSecretExpiresAt;

    private final String clientName;

    ...
}

```

Помечая класс как RedisHash мы будем сохранять его в redis.

Создадим репозиторий для хранения клиентов:

```java
@Repository
public interface OAuth2RegisteredClientRepository extends CrudRepository<OAuth2RegisteredClient, String> {

    OAuth2RegisteredClient findByClientId(String clientId);

}
```

Но так как по `RegisteredClientRepository` нужно возвращать `RegisteredClient`, а у нас свой собственный класс, нужно написать маппер между двумя классами:

```java
public final class ModelMapper {

    public static OAuth2RegisteredClient convertOAuth2RegisteredClient(RegisteredClient registeredClient) {
        OAuth2RegisteredClient.ClientSettings clientSettings = new OAuth2RegisteredClient.ClientSettings(
                registeredClient.getClientSettings().isRequireProofKey(),
                registeredClient.getClientSettings().isRequireAuthorizationConsent(),
                registeredClient.getClientSettings().getJwkSetUrl(),
                registeredClient.getClientSettings().getTokenEndpointAuthenticationSigningAlgorithm(),
                registeredClient.getClientSettings().getX509CertificateSubjectDN());

        OAuth2RegisteredClient.TokenSettings tokenSettings = new OAuth2RegisteredClient.TokenSettings(
                registeredClient.getTokenSettings().getAuthorizationCodeTimeToLive(),
                registeredClient.getTokenSettings().getAccessTokenTimeToLive(),
                registeredClient.getTokenSettings().getAccessTokenFormat(),
                registeredClient.getTokenSettings().getDeviceCodeTimeToLive(),
                registeredClient.getTokenSettings().isReuseRefreshTokens(),
                registeredClient.getTokenSettings().getRefreshTokenTimeToLive(),
                registeredClient.getTokenSettings().getIdTokenSignatureAlgorithm(),
                registeredClient.getTokenSettings().isX509CertificateBoundAccessTokens());

        return new OAuth2RegisteredClient(registeredClient.getId(), registeredClient.getClientId(),
                registeredClient.getClientIdIssuedAt(), registeredClient.getClientSecret(),
                registeredClient.getClientSecretExpiresAt(), registeredClient.getClientName(),
                registeredClient.getClientAuthenticationMethods(), registeredClient.getAuthorizationGrantTypes(),
                registeredClient.getRedirectUris(), registeredClient.getPostLogoutRedirectUris(),
                registeredClient.getScopes(), clientSettings, tokenSettings);
    }

    ...

}
```

И теперь напишем собственный `RegisteredClientRepository`:

```java
public class RedisRegisteredClientRepository implements RegisteredClientRepository {

    private final OAuth2RegisteredClientRepository registeredClientRepository;

    public RedisRegisteredClientRepository(OAuth2RegisteredClientRepository registeredClientRepository) {
        Assert.notNull(registeredClientRepository, "registeredClientRepository cannot be null");
        this.registeredClientRepository = registeredClientRepository;
    }

    @Override
    public void save(RegisteredClient registeredClient) {
        Assert.notNull(registeredClient, "registeredClient cannot be null");
        OAuth2RegisteredClient oauth2RegisteredClient = ModelMapper.convertOAuth2RegisteredClient(registeredClient);
        this.registeredClientRepository.save(oauth2RegisteredClient);
    }

    @Nullable
    @Override
    public RegisteredClient findById(String id) {
        Assert.hasText(id, "id cannot be empty");
        return this.registeredClientRepository.findById(id).map(ModelMapper::convertRegisteredClient).orElse(null);
    }

    @Nullable
    @Override
    public RegisteredClient findByClientId(String clientId) {
        Assert.hasText(clientId, "clientId cannot be empty");
        OAuth2RegisteredClient oauth2RegisteredClient = this.registeredClientRepository.findByClientId(clientId);
        return oauth2RegisteredClient != null ? ModelMapper.convertRegisteredClient(oauth2RegisteredClient) : null;
    }

}
```

И создадим бин следующим образом:

```java
 @Bean
public RegisteredClientRepository registeredClientRepository(OAuth2RegisteredClientRepository registeredClientRepository) {
    RedisRegisteredClientRepository redisRegisteredClientRepository =
            new RedisRegisteredClientRepository(registeredClientRepository);

    // тут можно настроить своих клиентов

    return redisRegisteredClientRepository;
}
```

Таким образом сервер авторизации теперь будет хранить и загружать конфигурацию клиентов в базе данных.

### Информация о пользователях

Чтобы сохранять информацию о пользователях нужно создать `UserDetailsManager`.

В целом похоже на то, что мы делали для сохранения информации о клиентах.

Создадим entity:

```java
@RedisHash("oauth2_user_details")
public class OAuth2User implements UserDetails, CredentialsContainer {
    @Id
    private final String username;
    private String password;
    private final Set<GrantedAuthority> authorities;
    private final boolean accountNonExpired;
    private final boolean accountNonLocked;
    private final boolean credentialsNonExpired;
    private final boolean enabled;

    ...

}

```

Создадим репозиторий:

```java
@Repository
public interface OAuth2UserDetailsRepository extends CrudRepository<OAuth2User, String> {

    OAuth2User findByUsername(String username);

}
```

Дополним маппер следующими методами:

```java
public static OAuth2User convertOAuth2UserDetails(UserDetails user) {
        return new OAuth2User(
                user.getUsername(),
                user.getPassword(),
                user.isEnabled(),
                user.isAccountNonExpired(),
                user.isCredentialsNonExpired(),
                user.isAccountNonLocked(),
                user.getAuthorities()
        );
    }

    public static UserDetails convertUserDetails(OAuth2User user) {
        return new User(
                user.getUsername(),
                user.getPassword(),
                user.isEnabled(),
                user.isAccountNonExpired(),
                user.isCredentialsNonExpired(),
                user.isAccountNonLocked(),
                user.getAuthorities()
        );
    }

```

и напишем сервис:

```java
public class RedisUserDetailsService implements UserDetailsService {

    private final OAuth2UserDetailsRepository userRepository;

    public RedisUserDetailsService(OAuth2UserDetailsRepository userRepository) {
        Assert.notNull(userRepository, "registeredClientRepository cannot be null");
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        OAuth2User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException(username);
        } else {
            return ModelMapper.convertUserDetails(user);
        }
    }

    public void createUser(UserDetails user) {
        Assert.notNull(user, "user cannot be null");
        OAuth2User oauth2RegisteredClient = ModelMapper.convertOAuth2UserDetails(user);
        this.userRepository.save(oauth2RegisteredClient);
    }

}
```

Но при запуске мы столкнемся с проблемой, что Spring не знает как входящие запросы распарсить как классы.
Для этого напишем конвертеры. Один из OAuth2User в byte[], второй byte[] в OAuth2User.

```java
@WritingConverter
public class UserToBytesConverter implements Converter<OAuth2User, byte[]> {

    private final Jackson2JsonRedisSerializer<OAuth2User> serializer;

    public UserToBytesConverter() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModules(
                SecurityJackson2Modules.getModules(UserToBytesConverter.class.getClassLoader()));
        objectMapper.registerModules(new OAuth2AuthorizationServerJackson2Module());
        objectMapper.addMixIn(OAuth2User.class, OAuth2UserMixin.class);
        this.serializer =
                new Jackson2JsonRedisSerializer<>(objectMapper, OAuth2User.class);
    }

    @Override
    public byte[] convert(OAuth2User value) {
        return this.serializer.serialize(value);
    }
}

```

```java
@ReadingConverter
public class BytesToUserConverter implements Converter<byte[], OAuth2User> {

    private final Jackson2JsonRedisSerializer<OAuth2User> serializer;

    public BytesToUserConverter() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModules(
                SecurityJackson2Modules.getModules(BytesToUserConverter.class.getClassLoader()));
        objectMapper.registerModule(new OAuth2AuthorizationServerJackson2Module());
        objectMapper.addMixIn(OAuth2User.class, OAuth2UserMixin.class);
        this.serializer =
                new Jackson2JsonRedisSerializer<>(objectMapper, OAuth2User.class);
    }

    @Override
    public OAuth2User convert(byte[] value) {
        return this.serializer.deserialize(value);
    }
}
```

и нужно определить Mixin для того, чтобы Spring мог корректно создать OAuth2User:

```java
@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS)
abstract class OAuth2UserMixin {

    @JsonCreator
    OAuth2UserMixin(@JsonProperty("username") String username,
                    @JsonProperty("password") String password,
                    @JsonProperty("enabled") boolean enabled,
                    @JsonProperty("accountNonExpired") boolean accountNonExpired,
                    @JsonProperty("credentialsNonExpired") boolean credentialsNonExpired,
                    @JsonProperty("accountNonLocked") boolean accountNonLocked,
                    @JsonProperty("authorities") Collection<String> authoroties) {
    }

}
```

и зарегистрировать конвертеры для использования Spring'ом в RedisConfig:

```java
 @Bean
public RedisCustomConversions redisCustomConversions() {
    return new RedisCustomConversions(Arrays.asList(
            new BytesToUserConverter(),
            new UserToBytesConverter()
    ));
}
```

Таким же образом было настроено хранения и других элементов: AuthorizationCodeGrantAuthorization, ClientCredentialsGrantAuthorization, DeviceCodeAuthorization, TokenExchangeGrantAuthorization и UserConsent.

## Prod & Deploy с помощью Docker

Для удобства использования jar файлов, настроим каждому сервису постоянное имя, без версии:

```xml
<build>
    <finalName>wewe-auth</finalName>

    ...

</build>
```

Для каждого сервера создадим свой Dockerfile, который будет запускать уже собранный jar файл с указанным профилем "prod". Настройка сервера авторизации будет выглядеть как указано ниже. Аналогично настраивается сервер ресурсов и клиент.

```dockerfile
FROM eclipse-temurin:23

COPY target/wewe-auth.jar wewe-auth.jar
ENTRYPOINT ["java","-Dspring.profiles.active=prod","-jar","/wewe-auth.jar"]
```

и создадим общий Docker-Compose файл:

```yaml
services:
  wewe-auth:
    build: auth
    ports:
      - "9001:9001"
    depends_on:
      - redis

  wewe-resource:
    build: resource
    depends_on:
      - wewe-auth

  wewe-client:
    build: client
    depends_on:
      - wewe-auth
      - wewe-resource
    ports:
      - "8080:8080"
    environment:
      # TODO: вынести в docker secrets
      CLIENT_SECRET: "{noop}secret"

  redis:
    image: redis
    restart: always
    ports:
      - "6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
    driver: local
```

Благодаря внутреннему dns докера запросы будут выполняться корректно, без дополнительной настройки, как они выполнялись при разработке.

Решение устанавливать https соединение между контейнерами кажется неоправданным, так как они сильно изолированы от внешней сети, и при этом скорость запросов замедлиться.

Для установки https содединения между конечным пользователем и сервером, на котором находится данное решение, можно настроить с помощью reverse-proxy в виде Nginx.