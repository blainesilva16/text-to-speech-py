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

    // --- Text to Speech Conversion Logic ---
    convertButton.addEventListener('click', function() {
        const textToConvert = textArea.value.trim();
        const selectedLanguage = languageSelect.value;

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
            body: JSON.stringify({ text: textToConvert, lang: selectedLanguage })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => { throw new Error(errorData.error || 'Server error'); });
            }
            return response.blob(); // Get the response as a Blob (binary data)
        })
        .then(blob => {
            const audioUrl = URL.createObjectURL(blob); // Create a URL for the Blob
            audioPlayer.src = audioUrl; // Set the audio player's source
            // audioPlayerContainer.style.display = 'flex'; // Make the audio player visible
            audioPlayer.load(); // Load the new audio
            audioPlayer.play(); // Auto-play the audio


            // Create a temporary link and trigger download
            const a = document.createElement("a");
            a.href = audioUrl;
            a.download = 'speech.mp3'; // Default filename
            document.body.appendChild(a);
            downloadMp3Button.addEventListener('click', function() {
                a.click(); // Trigger download
            });
            document.body.removeChild(a);
            // // Set download button for the created URL
            // downloadMp3Button.href = audioUrl;
            // downloadMp3Button.download = 'speech.mp3';
            // downloadMp3Button.style.display = 'inline-block'; // Show download button
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