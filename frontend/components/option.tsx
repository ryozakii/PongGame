import React from 'react'

function option(props: {value : string}) {
	return(
		<option value={props.value}> {props.value.charAt(0).toUpperCase() + props.value.slice(1)};</option>
	)
}

export default option