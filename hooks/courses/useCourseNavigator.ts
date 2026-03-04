import { CourseOutlineChildNode } from '@/types/courses';

const useCourseNavigator = (courseData: CourseOutlineChildNode, unitID: string) => {
  // Helper function to flatten third-level children with reference to 1st and 2nd level blocks
  function flattenThirdLevelChildren(data: CourseOutlineChildNode) {
    const thirdLevelChildren: {
      id: any;
      chapterIndex: any;
      sequentialIndex: any;
      thirdLevelIndex: any;
      display_name: any;
    }[] = [];

    Array.isArray(data.children) &&
      data.children.forEach((chapter, chapterIndex) => {
        Array.isArray(chapter.children) &&
          chapter.children.forEach((sequential, sequentialIndex) => {
            Array.isArray(sequential.children) &&
              sequential.children.forEach((thirdLevel, thirdLevelIndex) => {
                thirdLevelChildren.push({
                  id: thirdLevel.id,
                  chapterIndex,
                  sequentialIndex,
                  thirdLevelIndex,
                  display_name: thirdLevel.display_name || `Block ${thirdLevel.id}`,
                });
              });
          });
      });

    return thirdLevelChildren;
  }

  // Function to move to the next or previous third-level child
  class BlockNavigator {
    thirdLevelChildren: {
      id: any;
      chapterIndex: any;
      sequentialIndex: any;
      thirdLevelIndex: any;
      display_name: any;
    }[];
    currentIndex: number;
    constructor(data: CourseOutlineChildNode, initialId: string | null = null) {
      this.thirdLevelChildren = flattenThirdLevelChildren(data);
      this.currentIndex = this.findInitialIndex(initialId); // Set initial index based on ID or default to 0
    }

    // Method to find the initial index based on the given ID
    findInitialIndex(initialId: string | null) {
      if (initialId) {
        const index = this.thirdLevelChildren.findIndex((block) => block.id === initialId);
        return index !== -1 ? index : 0; // If ID not found, start at the first block
      }
      return 0; // Default to the first block if no ID provided
    }

    // Get current block
    getCurrentBlock() {
      return this.thirdLevelChildren[this.currentIndex];
    }

    // Move to the next block
    moveToNext() {
      if (this.currentIndex < this.thirdLevelChildren.length - 1) {
        this.currentIndex++;
        return this.getCurrentBlock();
      } else {
        console.log('Reached the last block.');
        return null;
      }
    }

    // Move to the previous block
    moveToPrevious() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        return this.getCurrentBlock();
      } else {
        console.log('Reached the first block.');
        return null;
      }
    }

    isPreviousHidden() {
      return this.currentIndex === 0;
    }

    isNextHidden() {
      return this.currentIndex === this.thirdLevelChildren.length - 1;
    }
  }
  const navigator = new BlockNavigator(courseData, unitID);

  return {
    navigator,
  };
};

export default useCourseNavigator;
