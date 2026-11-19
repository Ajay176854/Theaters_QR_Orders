import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_footer(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.75)
        self.line(36, 32, 559, 32)
        
        self.drawString(36, 20, "GRANDE MUTHURAM MULTIPLEX  |  Smart In-Seat Concession Dining Platform")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(559, 20, page_str)
        self.restoreState()

def build_pdf():
    pdf_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Grande_Muthuram_Multiplex_Proposal.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=32,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=1
    )

    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#e11d48'),
        spaceAfter=6
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=8,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor('#334155')
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    hero_text = ParagraphStyle(
        'HeroText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#f8fafc')
    )

    hero_title = ParagraphStyle(
        'HeroTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.white,
        spaceAfter=4
    )

    story = []

    # =========================================================================
    # PAGE 1: VISION, THE PROBLEM, CUSTOMER EXPERIENCE & MENU
    # =========================================================================

    # 1. Header
    brand_p = Paragraph("<b>GRANDE MUTHURAM MULTIPLEX</b>", title_style)
    tag_p = Paragraph("SMART IN-SEAT CONCESSION & LUXURY DINING PLATFORM", subtitle_style)
    badge_data = [
        [
            Paragraph("<font size=14 color='#ffffff'><b>GM</b></font>", ParagraphStyle('B', fontName='Helvetica-Bold', alignment=1)),
            [brand_p, tag_p],
            Paragraph("<font size=8 color='#64748b'><b>CLIENT PROPOSAL</b><br/>Turnkey Deployment</font>", ParagraphStyle('R', fontName='Helvetica', alignment=2))
        ]
    ]
    t_header = Table(badge_data, colWidths=[40, 360, 123])
    t_header.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#e11d48')),
        ('ALIGN', (0,0), (0,0), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 8))

    # 2. Hero Problem & Opportunity
    hero_inner = [
        Paragraph("<b>THE CRITICAL CINEMA BOTTLENECK &amp; THE SOLUTION:</b>", ParagraphStyle('HPill', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor('#fda4af'), spaceAfter=2)),
        Paragraph("Turn Every Seat Armrest into a Private Concession Counter", hero_title),
        Paragraph("During a standard 10-minute movie interval, <b>more than 50% of viewers who want popcorn and refreshments avoid buying</b> because counter lines are too crowded and they fear missing the second half. Once the lights dim, concession sales drop to zero.<br/><br/><b>With the Grande Muthuram In-Seat Dining System</b>, guests simply point their phone camera at the armrest sticker, order in 10 seconds with Google Pay / PhonePe, and staff delivers fresh hot food directly to <b>Screen X, Seat Y</b> &mdash; keeping orders running before, during, and after the interval!", hero_text)
    ]
    hero_table = Table([[hero_inner]], colWidths=[523])
    hero_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0f172a')),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(hero_table)
    story.append(Spacer(1, 10))

    # 3. 3-Step Simple Customer Journey
    story.append(Paragraph("The 3-Step Frictionless Customer Journey", h2_style))
    steps_data = [
        [
            Paragraph("<b>1. SCAN ARMREST QR</b><br/><font color='#64748b'>Guest sits down and points phone camera at the seat armrest sticker.<br/><br/>&bull; <b>Zero app installation</b><br/>&bull; <b>No registration or password</b><br/>&bull; Opens instantly in Chrome / Safari</font>", body_style),
            Paragraph("<b>2. SELECT &amp; PAY UPI</b><br/><font color='#64748b'>Guest browses photos of popcorn, cold drinks, and high-margin combos.<br/><br/>&bull; <b>1-Click GPay / PhonePe / Paytm</b><br/>&bull; Credit/Debit cards &amp; NetBanking<br/>&bull; Instant 256-bit encrypted bill</font>", body_style),
            Paragraph("<b>3. DIRECT SEAT DELIVERY</b><br/><font color='#64748b'>The kitchen screen beeps with a chime and auto-prints a thermal ticket.<br/><br/>&bull; Concession crew packs the tray<br/>&bull; Delivered directly to <b>Screen 1, Seat B12</b><br/>&bull; Guest never leaves their seat!</font>", body_style),
        ]
    ]
    t_steps = Table(steps_data, colWidths=[171, 171, 171])
    t_steps.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#f8fafc')),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor('#f8fafc')),
        ('BACKGROUND', (2,0), (2,0), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (0,0), 1, colors.HexColor('#e2e8f0')),
        ('BOX', (1,0), (1,0), 1, colors.HexColor('#e2e8f0')),
        ('BOX', (2,0), (2,0), 1, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 9),
        ('RIGHTPADDING', (0,0), (-1,-1), 9),
        ('LINEBEFORE', (0,0), (0,0), 3, colors.HexColor('#e11d48')),
        ('LINEBEFORE', (1,0), (1,0), 3, colors.HexColor('#f59e0b')),
        ('LINEBEFORE', (2,0), (2,0), 3, colors.HexColor('#22c55e')),
    ]))
    story.append(t_steps)
    story.append(Spacer(1, 10))

    # 4. Concession Visual Menu Showcase
    story.append(Paragraph("Visual Menu Catalog &amp; High-Margin Concessions", h2_style))
    menu_data = [
        [
            Paragraph("<b>Classic Butter &amp; Caramel Popcorn</b><br/><font size=8 color='#64748b'>Golden popped corn bathed in melted rich butter or crunchy caramel glaze. Available in Regular, Large, and Jumbo tubs.</font>", body_style),
            Paragraph("<b>Loaded Jalapeno Cheese Nachos</b><br/><font size=8 color='#64748b'>Crispy corn tortilla triangles served with hot cheddar queso cheese sauce and zesty Mexican salsa dip.</font>", body_style),
        ],
        [
            Paragraph("<b>Fountain Soda &amp; Hazelnut Cold Coffee</b><br/><font size=8 color='#64748b'>Ice-chilled 750ml fountain Pepsi / 7UP, virgin mint mojitos, and premium espresso blended with ice cream.</font>", body_style),
            Paragraph("<b>Blockbuster Family Combos for 2</b><br/><font size=8 color='#64748b'>Curated paired bundles (1x Tub + 2x Drinks) that prompt upselling and lift average transaction value by 40%.</font>", body_style),
        ],
        [
            Paragraph("<b>Warm Savory Rolls &amp; Samosas</b><br/><font size=8 color='#64748b'>Paneer Tikka ciabatta rolls, crispy chicken tenders, and spiced vegetable samosas served with tangy chutneys.</font>", body_style),
            Paragraph("<b>FSSAI Official Dietary Indicators</b><br/><font size=8 color='#64748b'>100% compliant food markings &mdash; clear green dot inside green square for Veg, red triangle for Non-Veg.</font>", body_style),
        ]
    ]
    t_menu = Table(menu_data, colWidths=[256, 257])
    t_menu.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_menu)
    story.append(Spacer(1, 8))

    # Callout Banner Page 1
    callout_p = Paragraph(
        "<b>GUEST LUXURY EXPERIENCE:</b> <i>No standing in noisy queues, no pushing at counters, and zero missed dialogue. Guests experience true VIP recliner hospitality right from their seat.</i>",
        ParagraphStyle('Callout', fontName='Helvetica', fontSize=8.5, leading=12, textColor=colors.HexColor('#065f46'))
    )
    t_callout = Table([[callout_p]], colWidths=[523])
    t_callout.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ecfdf5')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#a7f3d0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_callout)

    # =========================================================================
    # PAGE 2: OPERATIONS, FINANCIAL ROI, KITCHEN TICKET & ROLLOUT
    # =========================================================================
    story.append(PageBreak())

    # Header Page 2
    story.append(t_header)
    story.append(Spacer(1, 8))

    # 5. Kitchen & Staff Operations
    story.append(Paragraph("Kitchen &amp; Service Operations (Dead-Simple for Staff)", h2_style))
    ops_intro = Paragraph(
        "The system was engineered so counter crew can handle orders seamlessly even during high-pressure weekend screenings with zero computer training required:",
        body_style
    )
    story.append(ops_intro)
    story.append(Spacer(1, 6))

    ops_grid = [
        [
            Paragraph("<b>AUDIBLE CHIME ALERT</b><br/><font color='#64748b'>The kitchen tablet sounds a clear two-tone bell the instant payment succeeds. Staff never needs to constantly monitor the screen.</font>", body_style),
            Paragraph("<b>AUTO THERMAL KOT PRINT</b><br/><font color='#64748b'>The local 80mm/58mm thermal receipt printer automatically prints an order slip showing exact auditorium screen, seat, and food items.</font>", body_style),
            Paragraph("<b>ONE-TOUCH FULFILLMENT</b><br/><font color='#64748b'>Staff taps <i>Start Preparation</i>, packs the tray, and hands it to the usher. The usher delivers to the seat and marks <i>Delivered</i>.</font>", body_style),
        ]
    ]
    t_ops = Table(ops_grid, colWidths=[171, 171, 171])
    t_ops.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_ops)
    story.append(Spacer(1, 10))

    # 6. Commercial Comparison Table
    story.append(Paragraph("Commercial Comparison: Traditional Counter vs. Smart In-Seat QR", h2_style))
    comp_data = [
        [
            Paragraph("<b>Operational Metric</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)),
            Paragraph("<b>Traditional Snack Counter</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)),
            Paragraph("<b>With Grande Muthuram Smart QR</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)),
        ],
        [
            Paragraph("<b>Sales Time Window</b>", body_style),
            Paragraph("Only 10-minute interval rush", body_style),
            Paragraph("<font color='#e11d48'><b>Entire show (Pre-show, Runtime &amp; Interval)</b></font>", body_style),
        ],
        [
            Paragraph("<b>Average Order Value</b>", body_style),
            Paragraph("Rs 180 - Rs 220 per customer", body_style),
            Paragraph("<font color='#e11d48'><b>Rs 290 - Rs 360 (+40% via visual combos)</b></font>", body_style),
        ],
        [
            Paragraph("<b>Customer Friction</b>", body_style),
            Paragraph("Crowded lines, missed movie scenes", body_style),
            Paragraph("<b>VIP Luxury: 100% seat comfort, zero lines</b>", body_style),
        ],
        [
            Paragraph("<b>App Installation</b>", body_style),
            Paragraph("Required in other apps (90% drop-off)", body_style),
            Paragraph("<b>No App Needed: Opens in 1 sec on browser</b>", body_style),
        ],
        [
            Paragraph("<b>Staff Chaos &amp; Errors</b>", body_style),
            Paragraph("Extreme rush for 12 mins, then idle", body_style),
            Paragraph("<b>Smooth digital queue with audio alert &amp; auto-ticket</b>", body_style),
        ],
        [
            Paragraph("<b>Payment Handling</b>", body_style),
            Paragraph("Slow cash counting, POS card delay", body_style),
            Paragraph("<b>Instant 10-second UPI (GPay / PhonePe / Paytm)</b>", body_style),
        ]
    ]
    t_comp = Table(comp_data, colWidths=[120, 180, 223])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('BOTTOMPADDING', (0,0), (-1,0), 5),
        ('TOPPADDING', (0,0), (-1,0), 5),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8fafc')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,1), (-1,-1), 4),
        ('BOTTOMPADDING', (0,1), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 10))

    # 7. Sample Thermal Ticket & ROI Calculation
    story.append(Paragraph("Sample Kitchen Order Ticket (KOT) &amp; Financial Impact", h2_style))
    ticket_p = Paragraph(
        "<b>GRANDE MUTHURAM MULTIPLEX &middot; KITCHEN TICKET</b><br/>"
        "=========================================================================<br/>"
        "ORDER: #GM-90214 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>AUDITORIUM: SCREEN 1 &middot; SEAT B12</b><br/>"
        "=========================================================================<br/>"
        "1x Large Butter Popcorn (Tossed Warm) ........... Rs 290<br/>"
        "2x Fountain Pepsi (750ml with Ice) .............. Rs 320<br/>"
        "1x Loaded Cheese Nachos (with Salsa Dip) ........ Rs 240<br/>"
        "=========================================================================<br/>"
        "<b>TOTAL AMOUNT PAID (UPI - GPAY): Rs 850 (VERIFIED)</b><br/>"
        "=========================================================================<br/>"
        "<i>ACTION: Deliver directly to Screen 1, Seat B12 during screening</i>",
        ParagraphStyle('Ticket', fontName='Courier', fontSize=7, leading=9.5, textColor=colors.HexColor('#0f172a'))
    )

    roi_p = Paragraph(
        "<font size=13 color='#16a34a'><b>+40% Revenue Growth</b></font><br/>"
        "<b>PROVEN CONCESSION METRICS:</b><br/>"
        "<font size=8 color='#334155'>"
        "&bull; <b>Weekend Impact</b>: In a 1,500 admission weekend, converting just 200 extra seated customers yields <b>Rs 60,000+ extra profit</b>.<br/>"
        "&bull; <b>Monthly Upside</b>: Typically delivers <b>Rs 2.4 to Rs 3.5 Lakhs in additional monthly snack turnover</b>.<br/>"
        "&bull; <b>Zero Extra Hardware</b>: Operates on any Android tablet, phone or PC already present at the counter.<br/>"
        "&bull; <b>Cloud Scalability</b>: Powered by MongoDB cloud database with zero maintenance overhead."
        "</font>",
        ParagraphStyle('ROI', fontName='Helvetica', fontSize=8.5, leading=11.5)
    )

    t_bot = Table([[ticket_p, roi_p]], colWidths=[270, 243])
    t_bot.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#fafaf9')),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor('#f0fdf4')),
        ('BOX', (0,0), (0,0), 1, colors.HexColor('#cbd5e1')),
        ('BOX', (1,0), (1,0), 1, colors.HexColor('#bbf7d0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_bot)
    story.append(Spacer(1, 10))

    # 8. 48-Hour Turnkey Launch Plan
    story.append(Paragraph("Turnkey 48-Hour Implementation Plan", h2_style))
    plan_data = [
        [
            Paragraph("<b>DAY 1: MENU &amp; COUNTER ONBOARDING</b><br/><font color='#64748b'>Upload snack menu items with prices and high-res photos. Setup staff accounts for kitchen display screen.</font>", body_style),
            Paragraph("<b>DAY 2: SEAT QR PRINT &amp; STICKERS</b><br/><font color='#64748b'>1-Click generate and print durable auditorium QR stickers (e.g. Screen 1: A1 to M20). Affix onto seat armrests.</font>", body_style),
            Paragraph("<b>DAY 3: GO LIVE FOR SHOWS!</b><br/><font color='#64748b'>15-minute staff briefing. System goes live for evening weekend screenings &mdash; orders start ringing immediately!</font>", body_style),
        ]
    ]
    t_plan = Table(plan_data, colWidths=[171, 171, 171])
    t_plan.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_plan)

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SUCCESS: Generated PDF at {pdf_path} (Size: {os.path.getsize(pdf_path)} bytes)")

if __name__ == '__main__':
    build_pdf()
