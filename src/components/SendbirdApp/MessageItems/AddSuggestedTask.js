import React from "react";
import "./add-suggestion.css";

export default function AddSuggestedTask({
  messageText,
  changeMessageText,
  changeSuggestionSubmit,
  setShowForm,
}) {
  return (
    <div className="bg-modal" style={{'display': 'flex'}}>
      <div className="modal-content">
        <div className="add_suggested_task_close_btn"   onClick={() => setShowForm(false)} >+</div>
        <h3 id="suggestion-task-form-title">Suggestion Task:</h3>
        <form onSubmit={(e) => {changeSuggestionSubmit(e)}}>
          <input
            type="text"
            id="suggestion_form_input"
            placeholder="Suggested Task"
            value={messageText}
            onChange={(event) => {
              changeMessageText(event.target.value);
            }}
          ></input>
          <button id="add_suggested_task_save_btn">Submit</button>
        </form>
      </div>
    </div>
  );
};