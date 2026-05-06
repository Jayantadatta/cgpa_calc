document.addEventListener('DOMContentLoaded', () => {
    const yearsContainer = document.getElementById('years-container');
    const addYearBtn = document.getElementById('add-year-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const totalCreditsEl = document.getElementById('total-credits');
    const finalCgpaEl = document.getElementById('final-cgpa');

    const toggleViewBtn = document.getElementById('toggle-view-btn');
    const calcCard = document.querySelector('.calc-card');

    let yearCount = 0;
    let isCompact = false;

    // Initialize with one year
    addYear();

    addYearBtn.addEventListener('click', addYear);
    clearAllBtn.addEventListener('click', clearAll);

    toggleViewBtn.addEventListener('click', () => {
        isCompact = !isCompact;
        if (isCompact) {
            calcCard.classList.add('compact-mode');
            toggleViewBtn.textContent = 'Detailed View';
        } else {
            calcCard.classList.remove('compact-mode');
            toggleViewBtn.textContent = 'Compact View';
        }
    });

    function createCourseRow() {
        const div = document.createElement('div');
        div.className = 'course-row';
        div.innerHTML = `
            <input type="text" placeholder="Course Name" title="Course Name (Optional)" class="c-name">
            <input type="number" placeholder="Credit*" title="Credit (Mandatory)" class="c-credit" min="0" step="0.5">
            <input type="number" placeholder="Inc 1 (25)" title="Incourse 1 (out of 25)" class="c-inc1" min="0" max="25" step="0.5">
            <input type="number" placeholder="Inc 2 (25)" title="Incourse 2 (out of 25)" class="c-inc2" min="0" max="25" step="0.5">
            <input type="number" placeholder="Att (5)" title="Attendance (out of 5)" class="c-att" min="0" max="5" step="0.5">
            <input type="number" placeholder="Inc+Att (30)" title="Incourse + Attendance (out of 30)" class="c-incatt" min="0" max="30" step="0.5">
            <input type="number" placeholder="Final (70)" title="Final Exam (out of 70)" class="c-final" min="0" max="70" step="0.5">
            <input type="number" placeholder="Total (100)" title="Total Marks (out of 100)" class="c-total" min="0" max="100" step="0.5">
            <select class="c-grade" title="Grade (Mandatory if Credits entered)">
                <option value="" disabled selected>Grade*</option>
                <option value="4.00">A+ (80-100)</option>
                <option value="3.75">A (75-79)</option>
                <option value="3.50">A- (70-74)</option>
                <option value="3.25">B+ (65-69)</option>
                <option value="3.00">B (60-64)</option>
                <option value="2.75">B- (55-59)</option>
                <option value="2.50">C+ (50-54)</option>
                <option value="2.25">C (45-49)</option>
                <option value="2.00">D (40-44)</option>
                <option value="0.00">F (<40)</option>
            </select>
            <button class="remove-course" aria-label="Remove Course">×</button>
        `;

        // Event listeners for calculation and auto-fill
        const inputs = div.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                handleRowUpdate(div, e.target);
                calculateCGPA();
            });
        });

        const removeBtn = div.querySelector('.remove-course');
        removeBtn.addEventListener('click', (e) => {
            const row = e.target.closest('.course-row');
            const parent = row.parentNode;
            if (parent.querySelectorAll('.course-row').length > 1) {
                row.remove();
                calculateCGPA();
            } else {
                alert("You must have at least one course in a year.");
            }
        });

        return div;
    }
    
    function handleRowUpdate(row, changedElement) {
        const inc1El = row.querySelector('.c-inc1');
        const inc2El = row.querySelector('.c-inc2');
        const attEl = row.querySelector('.c-att');
        const incAttEl = row.querySelector('.c-incatt');
        const finalEl = row.querySelector('.c-final');
        const totalEl = row.querySelector('.c-total');
        const gradeEl = row.querySelector('.c-grade');
        
        let shouldCalcTotal = false;

        // Auto-calculate Inc+Att if individual components change
        if (changedElement === inc1El || changedElement === inc2El || changedElement === attEl) {
            const v1 = parseFloat(inc1El.value);
            const v2 = parseFloat(inc2El.value);
            const vA = parseFloat(attEl.value) || 0;
            
            let avgInc = 0;
            if (!isNaN(v1) && !isNaN(v2)) {
                avgInc = (v1 + v2) / 2;
            } else if (!isNaN(v1)) {
                avgInc = v1;
            } else if (!isNaN(v2)) {
                avgInc = v2;
            }
            
            if (!isNaN(v1) || !isNaN(v2) || !isNaN(vA)) {
                incAttEl.value = (avgInc + vA).toFixed(2);
                shouldCalcTotal = true;
            }
        }
        
        // Auto-calculate Total if Inc+Att or Final changes
        if (changedElement === incAttEl || changedElement === finalEl || shouldCalcTotal) {
            const vIncAtt = parseFloat(incAttEl.value) || 0;
            const vFinal = parseFloat(finalEl.value) || 0;
            
            if (incAttEl.value !== '' || finalEl.value !== '') {
                // Round total to nearest whole number as per typical grading
                totalEl.value = Math.round(vIncAtt + vFinal);
                changedElement = totalEl; // Trigger grade calculation
            }
        }
        
        // Auto-calculate Grade if Total changes
        if (changedElement === totalEl) {
            const t = parseFloat(totalEl.value);
            if (!isNaN(t)) {
                if (t >= 80) gradeEl.value = '4.00';
                else if (t >= 75) gradeEl.value = '3.75';
                else if (t >= 70) gradeEl.value = '3.50';
                else if (t >= 65) gradeEl.value = '3.25';
                else if (t >= 60) gradeEl.value = '3.00';
                else if (t >= 55) gradeEl.value = '2.75';
                else if (t >= 50) gradeEl.value = '2.50';
                else if (t >= 45) gradeEl.value = '2.25';
                else if (t >= 40) gradeEl.value = '2.00';
                else gradeEl.value = '0.00';
            }
        }
    }

    // Number mapping (1st, 2nd, 3rd...)
    function getOrdinalIndicator(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    function addYear() {
        yearCount++;
        const yearId = `year-${Date.now()}`;
        
        const div = document.createElement('div');
        div.className = 'year-block';
        div.id = yearId;
        
        div.innerHTML = `
            <div class="year-header">
                <h3>${getOrdinalIndicator(yearCount)} Year</h3>
                <button class="remove-year">🗑️</button>
            </div>
            
            <div class="course-table-header">
                <div>Course Name</div>
                <div>Credit</div>
                <div>Inc 1 (25)</div>
                <div>Inc 2 (25)</div>
                <div>Att (5)</div>
                <div>Inc+Att (30)</div>
                <div>Final (70)</div>
                <div>Total</div>
                <div>Grade</div>
                <div>Act</div>
            </div>
            
            <div class="courses-container"></div>
            <button class="add-course-btn">+ Add Another Course</button>
            <div class="year-footer">
                <div class="year-gpa">Year GPA: <span class="sgpa-value">0.00</span></div>
            </div>
        `;

        const coursesContainer = div.querySelector('.courses-container');
        // Add 9 default courses as requested
        for (let i = 0; i < 9; i++) {
            coursesContainer.appendChild(createCourseRow());
        }

        // Add course event
        const addCourseBtn = div.querySelector('.add-course-btn');
        addCourseBtn.addEventListener('click', () => {
            coursesContainer.appendChild(createCourseRow());
        });

        // Remove year event
        const removeYearBtn = div.querySelector('.remove-year');
        removeYearBtn.addEventListener('click', (e) => {
            const block = e.target.closest('.year-block');
            block.remove();
            updateYearNumbers();
            calculateCGPA();
        });

        yearsContainer.appendChild(div);
        calculateCGPA();
    }

    function updateYearNumbers() {
        const headers = yearsContainer.querySelectorAll('.year-header h3');
        yearCount = headers.length;
        headers.forEach((header, index) => {
            header.textContent = `${getOrdinalIndicator(index + 1)} Year`;
        });
    }

    function clearAll() {
        if(confirm("Are you sure you want to clear all data?")) {
            yearsContainer.innerHTML = '';
            yearCount = 0;
            addYear();
            calculateCGPA();
        }
    }

    function calculateCGPA() {
        let totalGlobalCredits = 0;
        let totalGlobalPoints = 0;

        const years = yearsContainer.querySelectorAll('.year-block');
        
        years.forEach(year => {
            let yearCredits = 0;
            let yearPoints = 0;
            
            const rows = year.querySelectorAll('.course-row');
            rows.forEach(row => {
                const creditInput = row.querySelector('.c-credit').value;
                const gradeInput = row.querySelector('.c-grade').value;

                if (creditInput && gradeInput) {
                    const credits = parseFloat(creditInput);
                    const gradePoint = parseFloat(gradeInput);

                    if (credits > 0) {
                        yearCredits += credits;
                        // Calculation formula: Summation(Total Marks/Points * Credit) / Total Credits
                        // Using Grade Points for traditional CGPA computation
                        yearPoints += (credits * gradePoint);
                    }
                }
            });

            // Update Year GPA
            const sgpaEl = year.querySelector('.sgpa-value');
            if (yearCredits > 0) {
                const sgpa = yearPoints / yearCredits;
                sgpaEl.textContent = sgpa.toFixed(2);
                
                totalGlobalCredits += yearCredits;
                totalGlobalPoints += yearPoints;
            } else {
                sgpaEl.textContent = '0.00';
            }
        });

        // Update Cumulative Values
        totalCreditsEl.textContent = totalGlobalCredits;
        
        if (totalGlobalCredits > 0) {
            const cgpa = totalGlobalPoints / totalGlobalCredits;
            finalCgpaEl.textContent = cgpa.toFixed(2);
            
            // Add pulse animation on update
            finalCgpaEl.parentElement.style.transform = 'scale(1.05)';
            setTimeout(() => {
                finalCgpaEl.parentElement.style.transform = 'scale(1)';
            }, 200);
        } else {
            finalCgpaEl.textContent = '0.00';
        }
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
