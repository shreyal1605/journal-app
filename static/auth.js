function handleAuth(type) {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const errorDisplay = document.getElementById('error-msg');

    if (!user || !pass) {
        errorDisplay.style.color = "red";
        errorDisplay.innerText = "Please fill in all fields.";
        return;
    }

    // We send the data to the route in app.py called /auth
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
            if (type === 'signup') {
                // If sign up works, show a green success message
                errorDisplay.style.color = "green";
                errorDisplay.innerText = data.message; 
            } else {
                // If login works, send them straight to the main journal!
                window.location.href = "/";
            }
        } else {
            // If it fails, show the red error message from Python
            errorDisplay.style.color = "red";
            errorDisplay.innerText = data.message;
        }
    })
    .catch(err => {
        errorDisplay.style.color = "red";
        errorDisplay.innerText = "Connection error. Try again.";
    });
}