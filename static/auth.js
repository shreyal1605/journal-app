function handleAuth(type) {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const errorDisplay = document.getElementById('error-msg');

    if (!user || !pass) {
        errorDisplay.style.color = "red";
        errorDisplay.innerText = "Please fill in all fields.";
        return;
    }

    errorDisplay.style.color = "orange";
    errorDisplay.innerText = "Connecting...";

    fetch('/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: user,
            password: pass,
            action: type
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (type === 'signup') {
                errorDisplay.style.color = "green";
                errorDisplay.innerText = data.message; 
                // Automatically toggle back to login after a brief pause
                setTimeout(() => {
                    if (typeof toggleAuthMode === 'function') toggleAuthMode();
                }, 1500);
            } else {
                window.location.href = "/";
            }
        } else {
            errorDisplay.style.color = "red";
            errorDisplay.innerText = data.message;
        }
    })
    .catch(err => {
        console.error(err);
        errorDisplay.style.color = "red";
        errorDisplay.innerText = "Connection error. Try again.";
    });
}