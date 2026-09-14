# Logowanie przez Google

Przyciski na ekranach logowania i rejestracji korzystają z OAuth Google (kod autoryzacyjny, PKCE i jednorazowy stan w ciasteczku HttpOnly). Aplikacja pobiera wyłącznie podstawowy profil i adres e-mail, bez dostępu do poczty Gmail.

1. W Google Cloud Console skonfiguruj ekran zgody OAuth i utwórz klienta OAuth typu „Web application”. W trybie testowym dodaj adresy kont testowych.
2. Dodaj autoryzowany URI przekierowania: `http://localhost:3000/api/auth/google/callback` lokalnie oraz `https://TWOJA-DOMENA/api/auth/google/callback` na produkcji.
3. Ustaw w `.env.local` lub w zmiennych środowiska hostingu:

```dotenv
GOOGLE_CLIENT_ID=identyfikator-klienta.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=sekret-klienta
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

Na produkcji użyj adresu HTTPS. Nie dodawaj sekretu do repozytorium ani zmiennych `NEXT_PUBLIC_*`. Uruchom aplikację ponownie po konfiguracji.

Pierwsze logowanie tworzy konto bez hasła, kolejne rozpoznaje użytkownika po stałym identyfikatorze Google. Istniejące konta z tym samym e-mailem nie są automatycznie łączone: użytkownik otrzymuje wskazówkę logowania dotychczasowym hasłem. Łączenie kont wymaga osobnego procesu potwierdzenia tożsamości.

Sprawdź: nowe konto Gmail, ponowne logowanie, anulowanie zgody, zajęty e-mail oraz brak konfiguracji. Pełny test wymaga prawdziwych danych klienta Google.

Dokumentacja: https://developers.google.com/identity/protocols/oauth2/web-server
