from flask import Flask, render_template, jsonify, request,send_file
from flask_bootstrap import Bootstrap5
import os,PyPDF2,io,dotenv
from gtts import gTTS

dotenv.load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
Bootstrap5(app)

app.config['UPLOAD_FOLDER'] = 'uploads' # Define an upload folder (optional, but good practice)
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True) # Create the folder if it doesn't exist

# Ensure a directory for static files where audio can be saved temporarily if needed
# Although for gTTS we'll use BytesIO to send directly
app.config['AUDIO_FOLDER'] = 'static/audio'
os.makedirs(app.config['AUDIO_FOLDER'], exist_ok=True)

accents = {
    'en':[{'value':'com.au',
           'lang':'English (Australia)'},
          {'value':'co.uk',
           'lang':'English (United Kingdom)'},
          {'value':'us',
           'lang':'English (United States)'},
          {'value':'ca',
           'lang':'English (Canada)'},
          {'value':'co.in',
           'lang':'Engilsh (India)'},
          {'value':'ie',
           'lang':'English (Ireland)'},
          {'value':'co.za',
           'lang':'English (South Africa)'},
          {'value':'com.ng',
           'lang':'English (Nigeria)'}],
    'fr':[{'value':'ca',
           'lang':'French (Canada)'},
          {'value':'fr',
           'lang':'French (France)'}],
    'pt':[{'value':'com.br',
           'lang':'Portuguese (Brazil)'},
          {'value':'pt',
           'lang':'Portuguese (Portugal)'}],
    'es':[{'value':'com.mx',
           'lang':'Spanish (Mexico)'},
          {'value':'es',
           'lang':'Spanish (Spain)'},
          {'value':'us',
           'lang':'Spanish (United States)'}]
}

@app.route("/", methods=["GET","POST"])
def home():
    return render_template('index.html')

@app.route('/change_accent',methods=['POST'])
def change_accent():
    data = request.get_json()
    lang = data.get('lang')
    if accents[lang]:
        return jsonify({'success':True,'accents':accents[lang]})
    else:
        return jsonify({'success':False,'error':'No accents available for this language'}),400

@app.route('/convert_to_speech', methods=['POST'])
def convert_to_speech():
    data = request.get_json()
    text = data.get('text')
    lang = data.get('lang', 'en') # Default to English if not provided
    accent = data.get('accent', 'us')

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        tts = gTTS(text=text, lang=lang, slow=False, tld=accent)
        # We'll use an in-memory byte stream instead of saving to a file
        audio_stream = io.BytesIO()
        tts.write_to_fp(audio_stream)
        audio_stream.seek(0) # Rewind the stream to the beginning

        # Return the audio file directly as a response
        return send_file(audio_stream, mimetype='audio/mpeg', as_attachment=False, download_name='speech.mp3')

    except Exception as e:
        print(f"Error during text-to-speech conversion: {e}")
        return jsonify({'error': f'Failed to convert text to speech: {str(e)}'}), 500


@app.route('/extract_pdf', methods=['POST'])
def extract_pdf():
    if 'pdf_file' not in request.files:
        return jsonify({'error': 'No PDF file provided'}), 400

    pdf_file = request.files['pdf_file']

    if pdf_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if pdf_file and pdf_file.filename.endswith('.pdf'):
        try:
            # Create a temporary path to save the uploaded PDF
            # In a real application, you might want to use a more robust way to handle temporary files
            # or directly process the BytesIO object from pdf_file.stream
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], pdf_file.filename)
            pdf_file.save(filepath)

            text = ""
            with open(filepath, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page_num in range(len(reader.pages)):
                    page = reader.pages[page_num]
                    text += page.extract_text() + "\n" # Add a newline between pages

            os.remove(filepath) # Clean up the uploaded file

            return jsonify({'text': text})

        except PyPDF2.utils.PdfReadError:
            return jsonify({'error': 'Could not read PDF file. It might be encrypted or corrupted.'}), 400
        except Exception as e:
            return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500
    else:
        return jsonify({'error': 'Invalid file type. Please upload a PDF file.'}), 400


if __name__ == '__main__':
    app.run(debug=True, port=5001)