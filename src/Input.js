import React from "react";
import "./Input.css";

export default class Input extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      active: (props.locked && props.active) || false,
      value: props.value || "",
      error: props.error || "",
      label: props.label || "Label"
    };
  }

  render() {
    const { active, value, error, label } = this.state;
    const { predicted, locked } = this.props;
    const fieldClassName = `field ${(locked ? active : active || value) &&
      "active"} ${locked && !active && "locked"}`;
    
    const p =  {...(this.props.inputProps || {})}
    if (p.type === null) { p.type = 'text'; }

    return (
      <div className={fieldClassName}>
        {active &&
          value &&
          predicted &&
          predicted.includes(value) && <p className="predicted">{predicted}</p>}
        <input
          id={this.props.id}
          value={value}
          placeholder={label}
          aria-labelledby={this.props.id + "_label"}
          onChange={e => { this.setState({value: e.target.value, error: ""}); if(this.props.onChange) { this.props.onChange(e) } }}
          onFocus={() => !locked && this.setState({ active: true })}
          onBlur={() => !locked && this.setState({ active: false })}
          {...p}
        />
        <label htmlFor={1} className={error && "error"} id={this.props.id + "_label"}>
          {error || label}
        </label>
      </div>
    );
  }
}
