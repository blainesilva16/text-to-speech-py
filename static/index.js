document.addEventListener('DOMContentLoaded', function() {
    const extractPdfButton = document.getElementById('extractPdfButton');
    const pdfFileInput = document.getElementById('pdfFileInput');
    const textArea = document.getElementById('textArea');
    const convertButton = document.getElementById('convertButton');
    const languageSelect = document.getElementById('languageSelect');
    const audioPlayerContainer = document.getElementById('audioPlayerContainer');
    const audioPlayer = document.getElementById('audioPlayer');
    const downloadMp3Button = document.getElementById('downloadMp3Button');
    const clearTextButton = document.getElementById('clearTextButton');
    const selectAccents = document.getElementById('selectAccents');
    let currentAudioUrl = null;

    // --- PDF Extraction Logic (from previous answer, slightly modified for clarity) ---
    extractPdfButton.addEventListener('click', function() {
        pdfFileInput.click();
    });

    pdfFileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                alert('Please select a PDF file.');
                return;
            }

            const formData = new FormData();
            formData.append('pdf_file', file);

            textArea.value = "Extracting text... please wait."; // User feedback
            // audioPlayerContainer.style.display = 'none'; // Hide audio player while extracting

            fetch('/extract_pdf', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.text) {
                    textArea.value = data.text;
                } else if (data.error) {
                    textArea.value = ""; // Clear text area on error
                    alert('Error extracting text: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                textArea.value = ""; // Clear text area on error
                alert('An error occurred during PDF extraction.');
            });
        }
        this.value = ''; // Clear file input so same file can be selected again
    });

    languageSelect.addEventListener('change', function() {
        const selectedLanguage = this.value;
        if (selectedLanguage.value == "0") {
            return
        }      
        let nodesSelectAccents = selectAccents.childNodes;
        [...nodesSelectAccents].map(node => node.remove());
        let lang = languageSelect.options[languageSelect.selectedIndex].value;
        fetch('/change_accent',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lang: lang })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                data["accents"].map(lang => {
                const option = document.createElement('option');
                option.setAttribute('value',lang.value)
                option.textContent = lang.lang
                selectAccents.appendChild(option)
            })
            } else if (data.error) {
                alert('Error fetching accents: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            textArea.value = ""; // Clear text area on error
            alert('An error occurred during PDF extraction.');
        });
    })

    downloadMp3Button.addEventListener('click', function() {
        if (currentAudioUrl) {
            // Create a temporary link and trigger download
            const a = document.createElement("a");
            a.href = currentAudioUrl;
            a.download = 'speech.mp3';
            document.body.appendChild(a);
            a.click(); // Trigger download
            document.body.removeChild(a);
        }
    });

    // --- Text to Speech Conversion Logic ---
    convertButton.addEventListener('click', function() {
        const textToConvert = textArea.value.trim();
        const selectedLanguage = languageSelect.value;
        const selectedAccent = selectAccents.value;

        if (textToConvert === "") {
            alert("Please enter some text to convert.");
            return;
        }

        // Show loading/processing feedback if desired
        convertButton.textContent = "Converting...";
        convertButton.disabled = true;
        // audioPlayerContainer.style.display = 'none'; // Hide player during conversion

        fetch('/convert_to_speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: textToConvert, lang: selectedLanguage, accent: selectedAccent })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => { throw new Error(errorData.error || 'Server error'); });
            }
            return response.blob(); // Get the response as a Blob (binary data)
        })
        .then(blob => {
            // Revoke previous blob URL if needed
            if (currentAudioUrl) {
                URL.revokeObjectURL(currentAudioUrl);
            }
            currentAudioUrl = URL.createObjectURL(blob); // Create a URL for the Blob
            audioPlayer.src = currentAudioUrl; // Set the audio player's source
            audioPlayer.load(); // Load the new audio
            audioPlayer.play(); // Auto-play the audio
            
        })
        .catch(error => {
            console.error('Error during text to speech conversion:', error);
            alert('Failed to convert text to speech: ' + error.message);
            // audioPlayerContainer.style.display = 'none'; // Hide player on error
        })
        .finally(() => {
            convertButton.textContent = "Convert to Speech";
            convertButton.disabled = false;
        });
    });

    // --- Download MP3 button (already handled by setting href/download attribute) ---
    clearTextButton.addEventListener('click', function() {
        textArea.value = ""; // Clear the text area
        audioPlayer.src = ""; // Stop any playing audio
    });
});