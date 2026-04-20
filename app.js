const storageKey = "student-registration-system-records";

const registrationForm = document.querySelector("#registration-form");
const statusBanner = document.querySelector("#status-banner");
const toast = document.querySelector("#toast");
const submitButton = document.querySelector("#submit-button");
const resetButton = document.querySelector("#reset-button");
const searchInput = document.querySelector("#search-input");
const departmentFilter = document.querySelector("#department-filter");
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

function sanitizeContactNumber(value) {
  return value.replace(/\D/g, "");
}

// Keep form values normalized before validation, comparison, and storage.
function getFormData() {
  return {
    studentName: normalizeText(formFields.studentName.value),
    studentId: normalizeText(formFields.studentId.value).toUpperCase(),
    email: normalizeText(formFields.email.value).toLowerCase(),
    contactNumber: sanitizeContactNumber(formFields.contactNumber.value),
    department: formFields.department.value,
    yearLevel: formFields.yearLevel.value
  };
}

function validateForm(data) {
  const errors = {};

  if (data.studentName.length < 3) {
    errors.studentName = "Please enter a full name with at least 3 characters.";
  }

  if (!/^[A-Z0-9-]{6,20}$/.test(data.studentId)) {
    errors.studentId = "Student ID should contain 6 to 20 uppercase letters, numbers, or hyphens.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (data.contactNumber.length < 10) {
    errors.contactNumber = "Contact number must contain at least 10 digits.";
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
    <p><strong>ID:</strong> ${student.studentId}</p>
    <p><strong>Email:</strong> ${student.email}</p>
    <p><strong>Contact:</strong> ${student.contactNumber}</p>
    <p><strong>Department:</strong> ${student.department}</p>
    <p><strong>Year Level:</strong> ${student.yearLevel}</p>
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
  updateSummary();
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
  updateFilterOptions();
  renderStudents();

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

  if (appState.editingId) {
    appState.students = appState.students.map((student) =>
      student.recordId === appState.editingId ? studentRecord : student
    );
  } else {
    appState.students.unshift(studentRecord);
  }

  saveStudents();
  updateFilterOptions();
  renderStudents();
}

registrationForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = getFormData();
  const errors = validateForm(formData);

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
updateFilterOptions();
renderStudents();
