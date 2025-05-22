import os, PyPDF2, pyttsx3

from customtkinter import CTkTextbox
from tkinterdnd2 import DND_FILES, TkinterDnD
import customtkinter as ctk
from tkinter import filedialog, messagebox

ctk.set_appearance_mode("dark")

class PdfToAudio:
    def __init__(self, root):

        self.root = root
        self.root.title("PDF to Audio App")
        self.root.geometry("600x550")
        self.root.configure(bg="#444444",padx=25,pady=20)

        self.frame = ctk.CTkFrame(root, width=450, height=250, corner_radius=25, fg_color="#777777")
        self.frame.place(x=50,y=50)

        self.canvas = ctk.CTkCanvas(self.frame, width=450, height=250, bg="#777777", highlightthickness=0)
        self.canvas.pack()

        self.button_upload = ctk.CTkButton(root,text="Upload PDF", fg_color="orange", text_color="white",
                                           corner_radius=25,command=self.upload_pdf)
        self.button_upload.place(x=100,y=5)

        self.button_save = ctk.CTkButton(root, text="Save Audio", fg_color="green", text_color="white",
                                           corner_radius=25,state="disabled",command=self.save_audio)
        self.button_save.place(x=300, y=5)

        self.pdf_text = CTkTextbox(root,width=300,height=150)
        self.pdf_text.place(x=50,y=350)

        self.label_info = ctk.CTkLabel(root,text="Number of pages: \n\n-")
        self.label_info.place(x=380,y=350)

        self.speak_button = ctk.CTkButton(root,width=20, text="Speak", fg_color="blue", text_color="white",
                                          command=self.speak_text,corner_radius=25,state="disabled")
        self.speak_button.place(x=400,y=420)

        self.root.drop_target_register(DND_FILES)
        self.root.dnd_bind('<<Drop>>', self.drop_pdf)


    def upload_pdf(self):
        file_path = filedialog.askopenfilename(title ="Choose the PDF File",
                                               )
        if file_path:
            self.load_pdf(file_path)

    def drop_pdf(self,event):
        file_path = event.data.strip("{}").split()[0]
        if os.path.exists(file_path):
            self.load_pdf(file_path)

    def load_pdf(self,file_path):
        print(file_path)
        try:
            # Open File
            pdf_file = PyPDF2.PdfReader(file_path)

        except:
            messagebox.showerror("Oops","Please provide PDF files!")
        else:
            self.button_save.configure(state="normal")
            self.speak_button.configure(state="normal")
            self.label_info.configure(text=f"Number of pages: \n\n{len(pdf_file.pages)}")
            content = ""
            for i in range(0,len(pdf_file.pages)):
                content += f"\n{pdf_file.pages[i].extract_text()}"
            self.pdf_text.delete(1.0,ctk.END)
            self.pdf_text.insert(1.0,content)

    def speak_text(self):
        text = self.pdf_text.get(1.0,ctk.END)
        engine = pyttsx3.init()
        voices = engine.getProperty('voices')
        engine.setProperty('voice', "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech\Voices\Tokens\TTS_MS_EN-US_DAVID_11.0")
        engine.say(text)
        engine.runAndWait()

    def save_audio(self):
        text = self.pdf_text.get(1.0, ctk.END)
        engine = pyttsx3.init()
        engine.save_to_file(text, 'pdf_to_audio.mp3')
        engine.runAndWait()

if __name__ == "__main__":
    app = TkinterDnD.Tk()
    PdfToAudio(app)
    app.mainloop()