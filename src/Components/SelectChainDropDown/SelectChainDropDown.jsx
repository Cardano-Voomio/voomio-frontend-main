import React, { useState } from "react";

const SelectChainDropDown = ({ title, item1, item2, item3, onChange }) => {
  const [isDropdown, setIsDropdown] = useState(false);
  const [currentItem, setCurrentItem] = useState(title);

  const openDropdown = () => {
    setIsDropdown(!isDropdown);
  };

  const onClickItem = (ItemName) => {
    setCurrentItem(ItemName);
    setIsDropdown(false);
    onChange(ItemName);
    console.log("selectedDropItemName:", ItemName);
  };

  return (
    <>
      <div className="text-left">
        <div className="dropdownborder rounded-2xl">
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 text-sm font-medium menufont z-50 text-[#6549F6]"
            id="menu-button"
            aria-expanded="true"
            aria-haspopup="true"
            onClick={openDropdown}
          >
            {currentItem}
            {/* Heroicon name: solid/chevron-down */}
            <svg
              className="-mr-1 ml-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        {isDropdown ? (
          <div
          className="text-[#000000]"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="menu-button"
            tabIndex={-1}
          >
            <div className="border-2 border-[#6549F6] absolute top-11 rounded-md p-5 lg:flex hidden flex-col bg-white text-[#6549F6] gap-3 hover" role="none">
              <div
                className="menufont block px-4 text-sm"
                role="menuitem"
                tabIndex={-1}
                id="menu-item-0"
                style={{cursor: "pointer"}}
                onClick={() => onClickItem(item1)}
              >
                {item1}
              </div>
              <div
                className="menufont block px-4 text-sm"
                role="menuitem"
                tabIndex={-1}
                id="menu-item-0"
                style={{cursor: "pointer"}}
                onClick={() => onClickItem(item2)}
              >
                {item2}
              </div>
              <div
                className="menufont block px-4 text-sm"
                role="menuitem"
                tabIndex={-1}
                id="menu-item-0"
                style={{cursor: "pointer"}}
                onClick={() => onClickItem(item3)}
              >
                {item3}
              </div>
              
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default SelectChainDropDown;
