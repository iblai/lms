import type React from "react"

interface FeedbackTabProps {
  feedbackData: any[] // Replace 'any' with a more specific type if possible
}

const FeedbackTab: React.FC<FeedbackTabProps> = ({ feedbackData }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Student Feedback</h2>
      {feedbackData.length > 0 ? (
        <ul>
          {feedbackData.map((feedback, index) => (
            <li key={index} className="mb-4 border p-4 rounded-md">
              <p className="text-base font-medium">Student: {feedback.studentName || "Unknown"}</p>
              <p className="text-base text-gray-700">Feedback: {feedback.comment || "No comment provided."}</p>
              {feedback.rating && <p className="text-base text-gray-700">Rating: {feedback.rating} / 5</p>}
              {feedback.suggestions && <p className="text-base text-gray-700">Suggestions: {feedback.suggestions}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-base text-gray-600">No feedback available.</p>
      )}
    </div>
  )
}

export default FeedbackTab
