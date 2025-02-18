import './style.css';
import { databases } from '/config/databaseConfig.js';
import { ID } from 'appwrite'; 

const DATABASE_ID = import.meta.env.VITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_COLLECTION_ID;

let jobForm = document.querySelector('#jobForm');

jobForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const editingId = jobForm.getAttribute('data-editing-id');
    const completed = document.querySelector('#completed').checked;

    if (editingId) {
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID,
            editingId,
            {
                "client-name": jobForm['client-name'].value,
                "date-added": jobForm['date-added'].value,
                "developer-assigned": jobForm['developer-assigned'].value,
                "severity": jobForm['severity'].value,
                "subject": jobForm['subject'].value,
                "description": jobForm['description'].value,
                "completed": completed
            }
        );

        jobForm.removeAttribute('data-editing-id'); 
    } else {
    
        await addJob();
    }

    jobForm.reset(); // Reset the form after submission
    await addJobsToDom(); // Refresh the job list
});

// Function to add a new job to the database
async function addJob() {
    const job = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
            "client-name": jobForm['client-name'].value,
            "date-added": jobForm['date-added'].value,
            "developer-assigned": jobForm['developer-assigned'].value,
            "severity": jobForm['severity'].value,
            "subject": jobForm['subject'].value,
            "description": jobForm['description'].value,
            "completed": document.querySelector('#completed').checked
        }
    );
    console.log('Job added:', job);
}

// Function to list all jobs in the dashboard
async function addJobsToDom() {
    const jobList = document.querySelector('ul');
    jobList.innerHTML = ""; // Clear existing jobs
    let response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID
    );

    // If there are no jobs, display a message
    if (response.documents.length === 0) {
        jobList.innerHTML = "<li class='text-black text-center'>No jobs submitted yet.</li>";
        return;
    }

    response.documents.forEach((job) => {
        const li = document.createElement('li');
        li.id = job.$id; // Set the ID for easy access
        li.classList.add('flex', 'justify-between', 'items-center', 'p-6', 'border-b');

        li.innerHTML = `
            <span>${job['client-name']} | ${job['date-added']} | ${job['developer-assigned']} | ${job['severity']} | ${job['subject']} | Completed: ${job['completed'] ? 'Yes' : 'No'}</span>
        `;

        const editBtn = document.createElement('button');
        editBtn.textContent = '✏️'; // Edit button
        editBtn.onclick = () => editJob(job.$id);
        editBtn.classList.add('text-blue-500', 'ml-4');

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️'; // Delete button
        deleteBtn.onclick = () => removeJob(job.$id);
        deleteBtn.classList.add('text-red-500', 'ml-4');

        li.appendChild(editBtn);
        li.appendChild(deleteBtn);

        jobList.appendChild(li);
    });
}

// Function to remove a job
async function removeJob(id) {
    await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id
    );
    document.getElementById(id).remove();
}

// Function to edit a job
async function editJob(id) {
    const jobElement = document.getElementById(id);
    const jobDetails = jobElement.querySelector('span').textContent.split(' - ');

    // Populate the form with existing details
    jobForm['client-name'].value = jobDetails[0];
    jobForm['date-added'].value = jobDetails[1];
    jobForm['developer-assigned'].value = jobDetails[2];
    jobForm['severity'].value = jobDetails[3];
    jobForm['subject'].value = jobDetails[4];

    // Fetch the job from the database to get the description and completed status
    const job = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id
    );

    // Populate the description and completed checkbox
    jobForm['description'].value = job.description;
    jobForm['completed'].checked = job.completed;

    // Set a flag to indicate we are updating
    jobForm.setAttribute('data-editing-id', id);
}

// Initial load of jobs
async function initialize() {
    await addJobsToDom();
}

initialize();