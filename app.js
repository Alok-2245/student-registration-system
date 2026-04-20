const storageKey = "student-registration-system-records";

const registrationForm = document.querySelector("#registration-form");
const statusBanner = document.querySelector("#status-banner");
const toast = document.querySelector("#toast");
const submitButton = document.querySelector("#submit-button");
const resetButton = document.querySelector("#reset-button");
const searchInput = document.querySelector("#search-input");
const departmentFilter = document.querySelector("#department-filter");
const tableShell = document.querySelector("#table-shell");
const tableBody = document.querySelector("#students-table-body");
const studentCards = document.querySelector("#student-cards");
const emptyState = document.querySelector("#empty-state");
const emptyStateTitle = document.querySelector("#empty-state-title");
const emptyStateCopy = document.querySelector("#empty-state-copy");
const totalStudents = document.querySelector("#total-students");
const totalDepartments = document.querySelector("#total-departments");
const submissionState = document.querySelector("#submission-state");

const formFields = {
  studentName: document.querySelector("#student-name"),
  studentId: document.querySelector("#student-id"),
  email: document.querySelector("#email"),
  contactNumber: document.querySelector("#contact-number"),
  department: document.querySelector("#department"),
  yearLevel: document.querySelector("#year-level")
};

const appState = {
  students: [],
  editingId: ""
};

// Keep submission feedback consistent across add, edit, validation, and delete flows.
function showStatus(message, state = "idle") {
  statusBanner.textContent = message;
  statusBanner.classList.remove("is-success", "is-error");

  if (state === "success") {
    statusBanner.classList.add("is-success");
  }

  if (state === "error") {
    statusBanner.classList.add("is-error");
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");

  window.clearTimeout(showToast.timerId);
  showToast.timerId = window.setTimeout(() => {
    toast.classList.add("hidden");
  }, 3200);
}

function getFieldErrorElement(fieldName) {
  return document.querySelector(`[data-error-for="${fieldName}"]`);
}

function clearErrors() {
  Object.keys(formFields).forEach((fieldName) => {
    getFieldErrorElement(fieldName).textContent = "";
  });
}

function normalizeText(value) {
  return value.trim().replace(/\s+/g, " ");
}

function sanitizeStudentName(value) {
  return value.replace(/[^A-Za-z\s]/g, "").replace(/\s{2,}/g, " ");
}

function sanitizeStudentId(value) {
  return value.replace(/\D/g, "");
}

function sanitizeContactNumber(value) {
  return value.replace(/\D/g, "");
}

// Keep form values normalized before validation, comparison, and storage.
function getFormData() {
  return {
    studentName: normalizeText(sanitizeStudentName(formFields.studentName.value)),
    studentId: sanitizeStudentId(formFields.studentId.value),
    email: normalizeText(formFields.email.value).toLowerCase(),
    contactNumber: sanitizeContactNumber(formFields.contactNumber.value),
    department: formFields.department.value,
    yearLevel: formFields.yearLevel.value
  };
}

function validateForm(data) {
  const errors = {};

  if (!data.studentName) {
    errors.studentName = "Student name is required.";
  } else if (!/^[A-Za-z\s]+$/.test(data.studentName)) {
    errors.studentName = "Student name should contain characters only.";
  }

  if (!data.studentId) {
    errors.studentId = "Student ID is required.";
  } else if (!/^\d+$/.test(data.studentId)) {
    errors.studentId = "Student ID should contain numbers only.";
  }

  if (!data.email) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!data.contactNumber) {
    errors.contactNumber = "Contact number is required.";
  } else if (!/^\d{10,}$/.test(data.contactNumber)) {
    errors.contactNumber = "Contact number must contain numbers only and at least 10 digits.";
  }

  if (!data.department) {
    errors.department = "Please select a department.";
  }

  if (!data.yearLevel) {
    errors.yearLevel = "Please select a year level.";
  }

  const hasDuplicateId = appState.students.some((student) => {
    if (appState.editingId && student.recordId === appState.editingId) {
      return false;
    }

    return student.studentId === data.studentId;
  });

  if (hasDuplicateId) {
    errors.studentId = "This student ID already exists.";
  }

  return errors;
}

function renderErrors(errors) {
  clearErrors();

  Object.entries(errors).forEach(([fieldName, message]) => {
    getFieldErrorElement(fieldName).textContent = message;
  });
}

// Persisting records in localStorage keeps the student list available after a refresh.
function loadStudents() {
  try {
    const storedStudents = localStorage.getItem(storageKey);
    appState.students = storedStudents ? JSON.parse(storedStudents) : [];
  } catch (error) {
    console.error("Unable to read student records from storage.", error);
    appState.students = [];
  }
}

function saveStudents() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(appState.students));
  } catch (error) {
    console.error("Unable to save student records.", error);
  }
}

function updateSummary() {
  totalStudents.textContent = String(appState.students.length);
  totalDepartments.textContent = String(new Set(appState.students.map((student) => student.department)).size);
  submissionState.textContent = appState.editingId ? "Editing" : "Ready";
}

function updateFilterOptions() {
  const selectedValue = departmentFilter.value;
  const departments = Array.from(new Set(appState.students.map((student) => student.department))).sort();

  departmentFilter.innerHTML = '<option value="All">All departments</option>';

  departments.forEach((department) => {
    const option = document.createElement("option");
    option.value = department;
    option.textContent = department;
    departmentFilter.append(option);
  });

  departmentFilter.value = departments.includes(selectedValue) || selectedValue === "All"
    ? selectedValue
    : "All";
}

function getVisibleStudents() {
  const searchTerm = normalizeText(searchInput.value).toLowerCase();
  const selectedDepartment = departmentFilter.value;

  return appState.students.filter((student) => {
    const matchesDepartment = selectedDepartment === "All" || student.department === selectedDepartment;
    const searchableText = [
      student.studentName,
      student.studentId,
      student.email,
      student.department,
      student.yearLevel
    ].join(" ").toLowerCase();

    const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
    return matchesDepartment && matchesSearch;
  });
}

function refreshStudentDisplay() {
  updateFilterOptions();
  renderStudents();
}

function createActionButton(label, action, recordId, extraClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `action-button ${extraClass}`.trim();
  button.dataset.action = action;
  button.dataset.recordId = recordId;
  button.textContent = label;
  return button;
}

function createTableRow(student) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${student.studentName}</td>
    <td>${student.studentId}</td>
    <td>${student.email}</td>
    <td>${student.contactNumber}</td>
    <td>${student.department}</td>
    <td>${student.yearLevel}</td>
    <td class="table-actions"></td>
  `;

  const actionCell = row.querySelector(".table-actions");
  actionCell.append(
    createActionButton("Edit", "edit", student.recordId),
    createActionButton("Delete", "delete", student.recordId, "action-button--danger")
  );

  return row;
}

function createStudentCard(student) {
  const article = document.createElement("article");
  article.className = "student-card";
  article.innerHTML = `
    <h3>${student.studentName}</h3>
    <div class="student-card__grid">
      <p><span>Student ID</span><strong>${student.studentId}</strong></p>
      <p><span>Email ID</span><strong>${student.email}</strong></p>
      <p><span>Contact No.</span><strong>${student.contactNumber}</strong></p>
      <p><span>Department</span><strong>${student.department}</strong></p>
      <p><span>Year Level</span><strong>${student.yearLevel}</strong></p>
    </div>
    <div class="card-actions"></div>
  `;

  const actions = article.querySelector(".card-actions");
  actions.append(
    createActionButton("Edit", "edit", student.recordId),
    createActionButton("Delete", "delete", student.recordId, "action-button--danger")
  );

  return article;
}

function renderStudents() {
  const visibleStudents = getVisibleStudents();
  tableBody.innerHTML = "";
  studentCards.innerHTML = "";

  // Render the same filtered dataset into both desktop and mobile layouts
  // so the table and card views never drift out of sync.
  visibleStudents.forEach((student) => {
    tableBody.append(createTableRow(student));
    studentCards.append(createStudentCard(student));
  });

  if (appState.students.length === 0) {
    emptyStateTitle.textContent = "No student records yet";
    emptyStateCopy.textContent = "Registered students will appear here after you submit the form.";
  } else if (visibleStudents.length === 0) {
    emptyStateTitle.textContent = "No matching students found";
    emptyStateCopy.textContent = "Try a different search term or choose another department filter.";
  }

  emptyState.classList.toggle("is-hidden", visibleStudents.length > 0);
  updateTableScrollbar(visibleStudents.length);
  updateSummary();
}

function updateTableScrollbar(visibleStudentCount) {
  const shouldScroll = visibleStudentCount > 5;
  tableShell.classList.toggle("table-shell--scrollable", shouldScroll);
}

function resetForm() {
  registrationForm.reset();
  clearErrors();
  appState.editingId = "";
  submitButton.textContent = "Register Student";
  submissionState.textContent = "Ready";
}

function fillForm(student) {
  formFields.studentName.value = student.studentName;
  formFields.studentId.value = student.studentId;
  formFields.email.value = student.email;
  formFields.contactNumber.value = student.contactNumber;
  formFields.department.value = student.department;
  formFields.yearLevel.value = student.yearLevel;
}

function handleEdit(recordId) {
  const student = appState.students.find((item) => item.recordId === recordId);

  if (!student) {
    return;
  }

  appState.editingId = recordId;
  fillForm(student);
  clearErrors();
  submitButton.textContent = "Update Student";
  showStatus(`Editing record for ${student.studentName}.`, "success");
  showToast(`Editing ${student.studentName}`);
  updateSummary();
}

function handleDelete(recordId) {
  const student = appState.students.find((item) => item.recordId === recordId);

  if (!student) {
    return;
  }

  appState.students = appState.students.filter((item) => item.recordId !== recordId);
  saveStudents();
  refreshStudentDisplay();

  if (appState.editingId === recordId) {
    resetForm();
  }

  showStatus(`${student.studentName} was removed successfully.`, "success");
  showToast("Student record deleted");
}

function upsertStudent(data) {
  const studentRecord = {
    ...data,
    recordId: appState.editingId || `record-${Date.now()}`
  };

  // Reuse the same function for both create and update so validation,
  // storage, and re-rendering follow one consistent path.
  if (appState.editingId) {
    appState.students = appState.students.map((student) =>
      student.recordId === appState.editingId ? studentRecord : student
    );
  } else {
    appState.students.unshift(studentRecord);
  }

  saveStudents();
  refreshStudentDisplay();
}

function syncFieldValue(fieldName) {
  if (fieldName === "studentName") {
    formFields.studentName.value = sanitizeStudentName(formFields.studentName.value);
  }

  if (fieldName === "studentId") {
    formFields.studentId.value = sanitizeStudentId(formFields.studentId.value);
  }

  if (fieldName === "contactNumber") {
    formFields.contactNumber.value = sanitizeContactNumber(formFields.contactNumber.value);
  }
}

function validateSingleField(fieldName) {
  const formData = getFormData();
  const errors = validateForm(formData);
  getFieldErrorElement(fieldName).textContent = errors[fieldName] || "";
}

Object.entries(formFields).forEach(([fieldName, field]) => {
  // Sanitize as the user types, then validate the active field in place
  // so errors are shown early without waiting for full form submission.
  field.addEventListener("input", () => {
    syncFieldValue(fieldName);
    validateSingleField(fieldName);
  });

  field.addEventListener("blur", () => {
    syncFieldValue(fieldName);
    validateSingleField(fieldName);
  });
});

registrationForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = getFormData();
  const isEmptySubmission = Object.values(formData).every((value) => value === "");
  const errors = validateForm(formData);

  if (isEmptySubmission) {
    renderErrors(errors);
    showStatus("Empty rows are not allowed. Fill in the student details first.", "error");
    showToast("Empty row not allowed");
    return;
  }

  if (Object.keys(errors).length > 0) {
    renderErrors(errors);
    showStatus("Please fix the highlighted form errors before submitting.", "error");
    showToast("Form validation failed");
    return;
  }

  const isEditing = Boolean(appState.editingId);
  upsertStudent(formData);
  resetForm();

  showStatus(
    isEditing
      ? "Student details updated successfully."
      : "Student registered successfully.",
    "success"
  );
  showToast(isEditing ? "Student updated" : "Student registered");
});

resetButton.addEventListener("click", () => {
  resetForm();
  showStatus("Form cleared. You can enter a new student record now.");
});

searchInput.addEventListener("input", () => {
  renderStudents();
});

departmentFilter.addEventListener("change", () => {
  renderStudents();
});

document.addEventListener("click", (event) => {
  // Event delegation keeps row and card actions working after every re-render.
  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) {
    return;
  }

  const { action, recordId } = actionButton.dataset;

  if (action === "edit") {
    handleEdit(recordId);
  }

  if (action === "delete") {
    handleDelete(recordId);
  }
});

// Restore previously saved records before the first render.
loadStudents();
refreshStudentDisplay();
