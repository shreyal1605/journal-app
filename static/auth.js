function handleAuth(type) {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorDisplay = document.getElementById('error-msg');

    if (!user || !pass) {
        errorDisplay.innerText = "Please fill in all fields.";
        return;
    }

    // We send the data to a new route in app.py called /auth
    fetch('/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: user,
            password: pass,
            action: type // either 'login' or 'signup'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // If login works, send them to the journal!
            window.location.href = "/";
        } else {
            // If it fails, show the error message from Python
            errorDisplay.innerText = data.message;
        }
    })
    .catch(err => {
        errorDisplay.innerText = "Connection error. Try again.";
    });
}