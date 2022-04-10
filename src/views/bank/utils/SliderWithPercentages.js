import React, { useState } from "react";
import { get } from "lodash";

import { formatNumber } from "./index";

const SliderWithPercentages = ({ state, isDeposit, onChange }) => {
  const [slideValue, setSlideValue] = useState(0);
  const stateProp = isDeposit ? "depositAmount" : "withdrawAmount";

  const setPercentage = (percentage) => {
    const balance = get(
      state,
      isDeposit ? "balances[0]" : "selectedPool.userDepositAmountInPool",
      "0"
    );

    const absolute = formatNumber((percentage / 100) * +balance, 12);
    console.log({
      state: state.selectedPool.userDepositAmountInPool,
      state: state.balance,
      balance,
      absolute,
    });
    // setSharedState({ ...state, [stateProp]: absolute });

    onChange({ [stateProp]: absolute });
  };

  const handleSlide = (value) => {
    setSlideValue(value);
    setPercentage(value);
  };

  const percentages = [25, 50, 75, 100];

  return (
    <div className="my-2">
      <input
        type="range"
        max="100"
        value={slideValue}
        className="range range-xs w-full"
        onChange={(e) => handleSlide(e.target.value)}
      />
      <div className="flex w-full justify-between">
        {percentages.map((percentage) => (
          <button
            className="btn btn-secondary btn-xs"
            key={percentage}
            onClick={(e) => {
              e.preventDefault();
              handleSlide(percentage);
              setPercentage(percentage);
            }}
          >
            {percentage}%
          </button>
        ))}
      </div>
    </div>
  );
};
export default SliderWithPercentages;
