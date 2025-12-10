document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('resumeForm');          // present only on index.html
  const addEducationBtn = document.getElementById('addEducation');
  const educationList = document.getElementById('educationList');
  const payButton = document.getElementById('payButton');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn'); // present only on success.html

  const isIndexPage = !!form;
  const isSuccessPage = !!downloadPdfBtn;

  // ---------- INDEX PAGE LOGIC ----------
  if (isIndexPage) {
    // ensure one education entry exists
    if (educationList && !educationList.querySelector('.education-entry')) {
      addEducationEntry();
    }

    if (addEducationBtn && educationList) {
      addEducationBtn.addEventListener('click', function() {
        addEducationEntry();
      });
    }

    if (payButton) {
      payButton.addEventListener('click', async function() {
        if (!form.reportValidity()) return;

        const resumeData = collectFormData();
        localStorage.setItem('resumeData', JSON.stringify(resumeData));

        try {
          const res = await fetch('/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product: 'resume_pdf' })
          });

          const data = await res.json();
          if (data && data.url) {
            window.location.href = data.url; // goes to Stripe
          } else {
            console.error(data);
            alert('Error starting payment. Please try again.');
          }
        } catch (error) {
          console.error('Error creating checkout session:', error);
          alert('Error starting payment. Please try again.');
        }
      });
    }

    // prevent accidental normal submit
    form.addEventListener('submit', e => e.preventDefault());
  }

  // ---------- SUCCESS PAGE LOGIC ----------
  if (isSuccessPage) {
  let resumeData = {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    aboutMe: '',
    expertise: '',
    hobbies: '',
    educationEntries: []
  };

  const stored = localStorage.getItem('resumeData');
  if (stored) {
    try {
      resumeData = JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse stored resumeData, using empty defaults.');
    }
  } else {
    console.warn('No resumeData found in localStorage, generating empty template.');
    // Optional: show a small text on the page instead of alert
    const card = document.querySelector('.success-card');
    if (card) {
      const msg = document.createElement('p');
      msg.style.fontSize = '0.85rem';
      msg.style.color = '#f97316';
      msg.style.marginTop = '0.75rem';
      msg.textContent = 'Note: Resume details could not be restored. The PDF may be empty if the form was not filled on this device/domain.';
      card.appendChild(msg);
    }
  }

  downloadPdfBtn.addEventListener('click', async function() {
    try {
      await generatePdfFromData(resumeData);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('There was an error generating the PDF. Please try again.');
    }
  });
}


  // ---------- HELPERS ----------
  function addEducationEntry(values = null) {
    const educationEntry = document.createElement('div');
    educationEntry.className = 'education-entry';
    educationEntry.innerHTML = `
      <div class="form-group">
        <label class="form-label">School Name</label>
        <input type="text" class="form-input school" required>
      </div>
      <div class="form-group">
        <label class="form-label">Year</label>
        <input type="text" class="form-input year" required>
      </div>
      <div class="form-group">
        <label class="form-label">Degree/Certificate</label>
        <input type="text" class="form-input degree" required>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-input description" rows="2" required></textarea>
      </div>
      <button type="button" class="btn btn-danger remove-education">Remove</button>
    `;

    const schoolInput = educationEntry.querySelector('.school');
    const yearInput = educationEntry.querySelector('.year');
    const degreeInput = educationEntry.querySelector('.degree');
    const descInput = educationEntry.querySelector('.description');

    if (values) {
      schoolInput.value = values.school || '';
      yearInput.value = values.year || '';
      degreeInput.value = values.degree || '';
      descInput.value = values.description || '';
    }

    const removeBtn = educationEntry.querySelector('.remove-education');
    removeBtn.addEventListener('click', function() {
      educationEntry.remove();
    });

    educationList.appendChild(educationEntry);
  }

  function collectFormData() {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const aboutMe = document.getElementById('aboutMe').value;
    const expertise = document.getElementById('expertise').value;
    const hobbies = document.getElementById('hobbies').value;

    const educationEntries = Array.from(
      document.querySelectorAll('.education-entry')
    ).map(entry => ({
      school: entry.querySelector('.school').value,
      year: entry.querySelector('.year').value,
      degree: entry.querySelector('.degree').value,
      description: entry.querySelector('.description').value
    }));

    return {
      fullName,
      email,
      phone,
      address,
      aboutMe,
      expertise,
      hobbies,
      educationEntries
    };
  }

  async function generatePdfFromData(data) {
    const fullName = (data.fullName || '').trim();
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ');

    const email = data.email || '';
    const phone = data.phone || '';
    const address = data.address || '';
    const aboutMe = data.aboutMe || '';

    const expertiseArr = (data.expertise || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const hobbiesArr = (data.hobbies || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const educationEntries = data.educationEntries || [];

    const resumePreview = document.createElement('div');
    resumePreview.style.position = 'fixed';
    resumePreview.style.left = '-9999px';
    resumePreview.style.top = '0';
    resumePreview.style.background = '#e5e7eb';
    resumePreview.style.width = '900px';
    resumePreview.style.padding = '40px 0';

    resumePreview.innerHTML = `
      <div style="
        margin: 0 auto;
        width: 700px;
        background: #ffffff;
        padding: 40px 50px 50px 50px;
        box-sizing: border-box;
        font-family: Arial, sans-serif;
        color: #111827;
      ">
        <div style="margin-bottom: 40px;">
          <div style="font-size: 46px; font-weight: 300; line-height: 1.1;">
            <div>${firstName}</div>
            <div style="letter-spacing: 8px;">${lastName}</div>
          </div>
        </div>

        <div style="display: flex; align-items: flex-start; gap: 40px;">
          <div style="flex: 0 0 220px;">
            <div style="margin-bottom: 28px;">
              <div style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Contact Me</div>
              <div style="height: 1px; background: #111827; margin-bottom: 10px;"></div>
              <div style="font-size: 11px; line-height: 1.6;">
                <div><strong>Address</strong><br>${address}</div>
                <div style="margin-top: 8px;"><strong>Phone</strong><br>${phone}</div>
                <div style="margin-top: 8px;"><strong>Email</strong><br>${email}</div>
              </div>
            </div>

            <div style="margin-bottom: 28px;">
              <div style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Expertise</div>
              <div style="height: 1px; background: #111827; margin-bottom: 10px;"></div>
              <ul style="list-style: none; padding: 0; margin: 0; font-size: 11px; line-height: 1.8;">
                ${expertiseArr.map(item => `<li>• ${item}</li>`).join('')}
              </ul>
            </div>

            <div>
              <div style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Hobbies</div>
              <div style="height: 1px; background: #111827; margin-bottom: 10px;"></div>
              <ul style="list-style: none; padding: 0; margin: 0; font-size: 11px; line-height: 1.8;">
                ${hobbiesArr.map(item => `<li>• ${item}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div style="flex: 1;">
            <div style="margin-bottom: 28px;">
              <div style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">About Me</div>
              <div style="height: 1px; background: #111827; margin-bottom: 10px;"></div>
              <div style="font-size: 11px; line-height: 1.7; text-align: justify; white-space: pre-line;">
                ${aboutMe}
              </div>
            </div>

            <div>
              <div style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Education</div>
              <div style="height: 1px; background: #111827; margin-bottom: 10px;"></div>
              <div style="font-size: 11px; line-height: 1.7;">
                ${educationEntries.map(ed => `
                  <div style="margin-bottom: 14px;">
                    <div style="display:flex; justify-content: space-between; font-weight: 700;">
                      <span>${ed.year}</span>
                      <span>${ed.school}</span>
                    </div>
                    <div style="font-weight: 700; margin-top: 2px;">
                      ${ed.degree}
                    </div>
                    <div style="margin-top: 2px;">
                      ${ed.description}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(resumePreview);

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        format: 'a4',
        unit: 'pt'
      });

      const canvas = await html2canvas(resumePreview, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#e5e7eb',
        windowWidth: 900,
        windowHeight: 1200
      });

      const imgData = canvas.toDataURL('image/png');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);

      const imgX = (pageWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      doc.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      doc.save('resume.pdf');
    } finally {
      document.body.removeChild(resumePreview);
    }
  }
});
