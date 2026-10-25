import React, { useState } from "react";

function SubmitQuiz() {
  const [responses, setResponses] = useState([{ id: "", response: "" }]);

  const handleChange = (index, field, value) => {
    const updatedResponses = [...responses];
    updatedResponses[index][field] = value;
    setResponses(updatedResponses);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // const result = await submitQuiz(responses);
    // alert(`Quiz Submitted! Score: ${result.score}`);
  };

  return (
    <div>
      <h2>Submit Quiz</h2>
      <form onSubmit={handleSubmit}>
        {responses.map((response, index) => (
          <div key={index}>
            <input
              type="text"
              name="id"
              placeholder="Question ID"
              value={response.id}
              onChange={(e) => handleChange(index, "id", e.target.value)}
            />
            <input
              type="text"
              name="response"
              placeholder="Your Answer"
              value={response.response}
              onChange={(e) => handleChange(index, "response", e.target.value)}
            />
          </div>
        ))}
        <button type="submit">Submit Quiz</button>
      </form>
    </div>
  );
}

export default SubmitQuiz;
