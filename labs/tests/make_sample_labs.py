#!/usr/bin/env python3
"""Makes fake lab reports (no real people or labs' real layouts copied) in three different styles, to test the parser.
All names, ids and values are invented."""
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures")
os.makedirs(OUT, exist_ok=True)
W, H = A4

def header(c, lab, y=H - 50):
    c.setFont('Helvetica-Bold', 14); c.drawString(40, y, lab)
    c.setFont('Helvetica', 9)
    c.drawString(40, y - 16, 'Patient Name : Test Person      Age/Gender : 45 Years / Male')
    c.drawString(40, y - 28, 'Lab Visit ID : ZZ0000123      Collection Date : 12/03/2026')
    c.drawString(40, y - 40, 'Referred by : Dr Sample      Address : 12 Example Road, Nowhere 560001')

# ---- A: four columns, section titles, sex-specific refs on wrapped lines, banded refs, comments ----
def summary_pages(c, n=3):
    texts = [
        'Doctor Summary', 'Overall your results are mostly in the expected range. A few values deserve attention.',
        'Your HbA1c of 5.9 percent is a little above 5.7, which is the usual upper limit for most adults.',
        'LDL cholesterol was 142 against a goal below 100. Triglycerides were 180. Please repeat after 8 weeks.',
        'Walk 30 minutes a day, 5 days a week, and reduce sugar. Vitamin D 18.2 is low; sunlight 20 minutes helps.',
        'Call us on 1800 000 0000 between 8 and 6 for any questions about this report.']
    for i in range(n):
        c.setFont('Helvetica-Bold', 14); c.drawString(40, H - 60, 'Health Report - Summary page %d' % (i + 1))
        c.setFont('Helvetica', 10)
        for j, t in enumerate(texts): c.drawString(40, H - 100 - j * 22, t)
        c.showPage()

def style_f_echo(path):
    c = canvas.Canvas(path, pagesize=A4)
    c.setFont('Helvetica-Bold', 15); c.drawString(40, H - 60, 'Sample Cardiac Centre - 2D Echocardiography with Colour Doppler')
    c.setFont('Helvetica', 10)
    lines = ['Patient Name : Test Person     Age/Sex : 45 / M     Date : 14/03/2026',
      'Left ventricle: normal size, LVEDD 48 mm, LVESD 30 mm. No regional wall motion abnormality.',
      'Left ventricular ejection fraction (LVEF) 60 percent.',
      'Mitral valve: normal, trivial regurgitation. Aortic valve: trileaflet, normal.',
      'Left atrium and right ventricle are normal. No pericardial effusion.',
      'Doppler: no significant gradient across any valve.',
      'Impression: Normal study. Good LV systolic function.']
    for i, t in enumerate(lines): c.drawString(40, H - 100 - i * 20, t)
    c.save()

def style_a(path, lead=0):
    c = canvas.Canvas(path, pagesize=A4)
    if lead: summary_pages(c, lead)
    header(c, 'Sample Diagnostics (Tata 1mg style)')
    y = H - 120
    def head(y):
        c.setFont('Helvetica-Bold', 9)
        for x, t in ((40, 'Test Name'), (230, 'Result'), (300, 'Unit'), (370, 'Bio. Ref. Interval')): c.drawString(x, y, t)
        c.line(40, y - 4, 540, y - 4)
    def sec(y, t): c.setFont('Helvetica-Bold', 10); c.drawString(40, y, t)
    def row(y, n, r, u, ref, extra=None):
        c.setFont('Helvetica', 9); c.drawString(40, y, n); c.drawString(230, y, r); c.drawString(300, y, u); c.drawString(370, y, ref)
        if extra: c.drawString(370, y - 11, extra)
    head(y); y -= 22; sec(y, 'COMPLETE BLOOD COUNT (CBC)'); y -= 16
    row(y, 'Haemoglobin', '12.1', 'g/dL', 'Male: 13.0 - 17.0', 'Female: 12.0 - 15.0'); y -= 28
    row(y, 'Total Leucocyte Count (TLC)', '7.2', 'thou/cumm', '4.0 - 10.0'); y -= 16
    row(y, 'Platelet Count', '145', 'thou/cumm', '150 - 410'); y -= 16
    row(y, 'MCV', '78.4', 'fL', '83.0 - 101.0'); y -= 24
    sec(y, 'LIPID PROFILE'); y -= 16
    row(y, 'Cholesterol - Total', '214', 'mg/dL', 'Desirable: < 200', 'Borderline: 200 - 239'); y -= 28
    row(y, 'HDL Cholesterol', '38', 'mg/dL', '> 40'); y -= 16
    row(y, 'LDL Cholesterol', '142', 'mg/dL', '< 100'); y -= 16
    row(y, 'Triglycerides', '180', 'mg/dL', '< 150'); y -= 24
    sec(y, 'HbA1c'); y -= 16
    row(y, 'HbA1c', '5.9', '%', '< 5.7 Normal  5.7 - 6.4 Prediabetes  >= 6.5 Diabetes'); y -= 24
    c.setFont('Helvetica-Oblique', 8); c.drawString(40, y, 'Comments: HbA1c reflects average blood sugar over about three months.'); y -= 14
    c.showPage()
    header(c, 'Sample Diagnostics (Tata 1mg style)'); y = H - 120; head(y); y -= 22
    sec(y, 'THYROID PROFILE'); y -= 16
    row(y, 'TSH', '6.8', 'uIU/mL', '0.35 - 4.94'); y -= 16
    row(y, 'Vitamin D (25-OH)', '18.2', 'ng/mL', 'Deficiency: <20 Insufficiency: 20-29 Sufficiency: 30-100'); y -= 24
    sec(y, 'URINE ROUTINE'); y -= 16
    row(y, 'Protein', 'Negative', '', 'Negative'); y -= 16
    row(y, 'Glucose', 'Negative', '', 'Negative')
    c.save()

# ---- B: Investigation | Result | Reference | Units, with H/L flag column and method lines ----
def style_b(path):
    c = canvas.Canvas(path, pagesize=A4)
    header(c, 'Example Path Labs (reference before units)')
    y = H - 120
    c.setFont('Helvetica-Bold', 9)
    for x, t in ((40, 'INVESTIGATION'), (250, 'RESULT'), (310, 'FLAG'), (350, 'REFERENCE VALUE'), (470, 'UNITS')): c.drawString(x, y, t)
    c.line(40, y - 4, 540, y - 4); y -= 20
    def row(y, n, r, f, ref, u, method=None):
        c.setFont('Helvetica', 9); c.drawString(40, y, n); c.drawRightString(285, y, r); c.drawString(312, y, f); c.drawString(350, y, ref); c.drawString(470, y, u)
        if method: c.setFont('Helvetica-Oblique', 7.5); c.drawString(40, y - 9, method)
    row(y, 'Glucose - Fasting', '112', 'H', '70 - 99', 'mg/dL', '(Method: Hexokinase)'); y -= 26
    row(y, 'Creatinine, Serum', '0.9', '', '0.7 - 1.3', 'mg/dL', '(Method: Jaffe)'); y -= 26
    row(y, 'SGPT (ALT)', '62', 'H', '< 45', 'U/L'); y -= 18
    row(y, 'SGOT (AST)', '38', '', '< 40', 'U/L'); y -= 18
    row(y, 'Vitamin B12', '176', 'L', '211 - 911', 'pg/mL'); y -= 18
    row(y, 'Ferritin', '28', '', '30 - 400', 'ng/mL'); y -= 18
    row(y, 'Uric Acid', '7.4', 'H', '3.5 - 7.2', 'mg/dL'); y -= 18
    c.showPage(); c.save()

# ---- C: no ruling, header only on page 1, results continue on page 2 ----
def style_c(path):
    c = canvas.Canvas(path, pagesize=A4)
    c.setFont('Helvetica-Bold', 13); c.drawString(40, H - 50, 'Metro Sample Laboratory')
    c.setFont('Helvetica', 9); c.drawString(40, H - 66, 'Registered : 05-Mar-26   Reported : 06-Mar-26')
    y = H - 100
    c.setFont('Helvetica-Bold', 9)
    for x, t in ((40, 'TEST NAME'), (260, 'VALUE'), (330, 'UNITS'), (400, 'REFERENCE RANGE')): c.drawString(x, y, t)
    y -= 22
    def row(n, r, u, ref):
        nonlocal y
        c.setFont('Helvetica', 9); c.drawString(40, y, n); c.drawString(260, y, r); c.drawString(330, y, u); c.drawString(400, y, ref); y -= 17
    row('Erythrocyte Sedimentation Rate (ESR)', '28', 'mm/hr', '0 - 15')
    row('C-Reactive Protein (CRP)', '4.2', 'mg/L', '< 5.0')
    row('Total Protein', '7.1', 'g/dL', '6.0 - 8.3')
    row('Albumin', '4.3', 'g/dL', '3.5 - 5.2')
    c.showPage()
    y = H - 60
    row('Sodium', '139', 'mmol/L', '136 - 145')
    row('Potassium', '5.4', 'mmol/L', '3.5 - 5.1')
    row('Calcium', '9.2', 'mg/dL', '8.6 - 10.2')
    c.save()

# ---- D: scanned-style: only a picture, no text layer ----
def style_d(path):
    from reportlab.lib.utils import ImageReader
    from PIL import Image, ImageDraw
    im = Image.new('RGB', (900, 600), 'white'); d = ImageDraw.Draw(im)
    d.text((40, 40), 'SCANNED REPORT (picture only)', fill='black'); d.text((40, 90), 'Haemoglobin 12.1 g/dL 13.0-17.0', fill='black')
    c = canvas.Canvas(path, pagesize=A4); c.drawImage(ImageReader(im), 40, H - 460, width=500, height=333); c.save()

style_a(os.path.join(OUT, 'style_a_table.pdf'))
style_a(os.path.join(OUT, 'style_e_summary_first.pdf'), lead=3)
style_f_echo(os.path.join(OUT, 'style_f_echo.pdf'))
style_b(os.path.join(OUT, 'style_b_flags.pdf'))
style_c(os.path.join(OUT, 'style_c_plain.pdf'))
style_d(os.path.join(OUT, 'style_d_scan.pdf'))
print('made', sorted(os.listdir(OUT)))
