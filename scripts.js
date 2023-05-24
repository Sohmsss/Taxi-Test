// Function to retrieve popular places using the Google Maps JavaScript API
async function getPopularPlaces() {
    return new Promise((resolve, reject) => {
        const request = {
            location: { lat: 51.359552, lng: 1.405619 }, // Replace with your desired location
            radius: 7000, // Specify the radius in meters
            type: "Popular places", // Specify the type of place you want to search for
        };

        const service = new google.maps.places.PlacesService(document.createElement("div"));
        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                resolve(results);
            } else {
                reject(status);
            }
        });
    });
}

// Function to generate a random integer between min and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to shuffle an array in place using Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = getRandomInt(0, i);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Function to generate a multiple-choice question with a popular place address
async function generateQuestion() {
    try {
        const popularPlaces = await getPopularPlaces();

        if (popularPlaces.length < 1) {
            return null; // Handle the case when no popular places are found
        }

        const randomIndex = getRandomInt(0, popularPlaces.length - 1);
        const correctPlace = popularPlaces[randomIndex];
        const correctAnswer = correctPlace.vicinity;

        // Get the other answer choices (distractors)
        const distractors = popularPlaces
            .filter((place, index) => index !== randomIndex)
            .map((place) => place.vicinity);

        // Shuffle the distractors and select the first 3
        const shuffledDistractors = shuffleArray(distractors);
        const answerChoices = [correctAnswer, ...shuffledDistractors.slice(0, 3)];

        // Shuffle the answer choices
        const shuffledAnswerChoices = shuffleArray(answerChoices);

        return {
            question: `Where is ${correctPlace.name} located?`,
            answerChoices: shuffledAnswerChoices,
            correctAnswer: correctAnswer
        };
    } catch (error) {
        console.log(error);
        return null; // Handle error case
    }
}

// Function to generate all the questions without repetition and display one at a time
async function generateAllQuestions() {
    const questionContainer = document.getElementById("question-container");
    const usedIndices = []; // Array to track used question indices

    for (let i = 0; i < 50; i++) {
        let questionElement = null;
        let questionIndex = null;

        do {
            questionIndex = getRandomInt(0, 49); // Generate a random question index
        } while (usedIndices.includes(questionIndex)); // Repeat if the question index has already been used

        usedIndices.push(questionIndex); // Add the question index to the used indices

        const questionData = await generateQuestion();
        if (questionData) {
            questionElement = createQuestionElement(questionData, questionIndex);
            questionContainer.innerHTML = ""; // Clear previous question
            questionContainer.appendChild(questionElement);
        }
    }
}

// Function to create the question element with an index
function createQuestionElement(questionData, index) {
    const questionElement = document.createElement("div");
    questionElement.classList.add("question");
    questionElement.dataset.index = index;

    const questionText = document.createElement("h3");
    questionText.textContent = questionData.question;

    questionElement.appendChild(questionText);

    questionData.answerChoices.forEach((choice) => {
        const choiceContainer = document.createElement("div");
        choiceContainer.classList.add("form-check");

        const radioInput = document.createElement("input");
        radioInput.type = "radio";
        radioInput.name = "answer";
        radioInput.value = choice;
        radioInput.classList.add("form-check-input");

        const choiceLabel = document.createElement("label");
        choiceLabel.classList.add("form-check-label");
        choiceLabel.textContent = choice;

        choiceContainer.appendChild(radioInput);
        choiceContainer.appendChild(choiceLabel);
        questionElement.appendChild(choiceContainer);
    });

    return questionElement;
}

// Function to handle form submission
async function handleSubmit(event) {
    event.preventDefault();

    const questionContainer = document.getElementById("question-container");
    const questionElements = Array.from(questionContainer.getElementsByClassName("question"));
    const scoreContainer = document.getElementById("score-container");
    const previousQuestionContainer = document.getElementById("previous-question-container");

    // Calculate the score
    let score = 0;
    questionElements.forEach((questionElement) => {
        const index = questionElement.dataset.index;
        const selectedAnswer = questionElement.querySelector("input[name='answer']:checked")?.value;
        const correctAnswer = questionElement.dataset.correctAnswer;

        if (selectedAnswer === correctAnswer) {
            score++;
            questionElement.classList.add("correct");
        } else {
            questionElement.classList.add("incorrect");
        }
    });

    // Display the score
    const scoreText = `Score: ${score}/${questionElements.length}`;
    const scoreElement = document.createElement("p");
    scoreElement.textContent = scoreText;

    // Append the score element to the score container
    scoreContainer.innerHTML = "";
    scoreContainer.appendChild(scoreElement);

    // Generate a new question
    const newQuestionData = await generateQuestion();
    if (newQuestionData) {
        // Display previous question and correct answer
        if (questionElements.length > 0) {
            const prevQuestion = questionElements[questionElements.length - 1];
            const prevQuestionText = prevQuestion.querySelector("h3").textContent;
            const prevCorrectAnswer = prevQuestion.dataset.correctAnswer;
            const prevQuestionResult = `Previous Question: ${prevQuestionText} - Correct Answer: ${prevCorrectAnswer}`;
            const prevQuestionElement = document.createElement("p");
            prevQuestionElement.classList.add("previous-question");
            prevQuestionElement.textContent = prevQuestionResult;

            // Append the previous question element to the previous question container
            previousQuestionContainer.appendChild(prevQuestionElement);
        }

        const newIndex = questionElements.length;
        const newQuestionElement = createQuestionElement(newQuestionData, newIndex);
        questionContainer.innerHTML = "";
        questionContainer.appendChild(newQuestionElement);
    } else {
        questionContainer.innerHTML = "No more questions available.";
    }
}


// Generate all the questions when the page loads
window.addEventListener("DOMContentLoaded", generateAllQuestions);

// Add event listener to the submit button
const submitButton = document.getElementById("submit-btn");
submitButton.addEventListener("click", handleSubmit);
