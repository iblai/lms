import { config } from '@/lib/config';
import { useLazyGetEdxSSOTokenQuery } from '@/services/edx-sso';
import { getUserName } from '@/utils/helpers';

export const useEdxIframe = () => {
  const [getEdxSsoAuthToken] = useLazyGetEdxSSOTokenQuery();

  function getIframeURL(course_id: string, courseInfo: any, callback: (url: string) => void) {
    //check if the courseInfo is an object, includes : or a string
    if (typeof courseInfo === 'object' || courseInfo.includes(':')) {
      flattenVerticalBlocks(courseInfo);
      let unit = getUnitToIframe(courseInfo);
      addIframeUrl(course_id, unit.id, callback);
    } else {
      addIframeUrl(course_id, courseInfo, callback);
    }
  }

  function findSequentialParent(data: any, verticalId: string): string | null {
    // Base case: if the current data block is of type 'sequential' and has children
    if (data.type === 'sequential' && data.children) {
      for (const child of data.children) {
        // Check if the child is the vertical block we are looking for
        if (child.id === verticalId) {
          return data.id; // Return the ID of the sequential block
        }
        // Recursively search deeper if the child is not the vertical block
        const foundId = findSequentialParent(child, verticalId);
        if (foundId) {
          return foundId; // Return the found ID if present
        }
      }
    } else if (data.children) {
      // Continue recursion if the block is not 'sequential' but has children
      for (const child of data.children) {
        const foundId = findSequentialParent(child, verticalId);
        if (foundId) {
          return foundId;
        }
      }
    }
    // Return null if no matching sequential parent is found at this level
    return null;
  }

  function flattenVerticalBlocks(data: any) {
    if (!data || typeof data !== 'object') {
      return [];
    }

    if (Array.isArray(data)) {
      const result = [];
      for (const item of data) {
        const flattenedItems: any[] = flattenVerticalBlocks(item);
        result.push(...flattenedItems);
      }
      return result;
    }

    if (data.type === 'vertical') {
      const block = {
        id: data.id,
        display_name: data.display_name,
      };

      const children: any[] = flattenVerticalBlocks(data.children);
      return [block, ...children];
    }

    return flattenVerticalBlocks(data.children);
  }

  function getFirstAvailableUnit(data: any, maxAttempts = 2) {
    console.log({ data });
    try {
      // Try to find the first available unit within the specified maxAttempts
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let element = data.children[0]?.children[0]?.children[attempt];
        if (element) return element; // Return the element if found
      }
    } catch (e) {
      // In case of any error, safely return the upper level element if available
      if (
        data.hasOwnProperty('children') &&
        data.children[0].hasOwnProperty('children') &&
        new Date(data.start) < new Date()
      ) {
        return data.children[0]?.children[0];
      } else {
        /* throw new Error(
          "Course has no content or course has not been started yet"
        ); */
        return null;
      }
    }

    return null; // Return null if no element is found after attempts
  }

  function findLastResumeBlock(courseData: any) {
    let lastResumeBlock = null;

    // Helper function to recursively traverse the tree
    function traverse(node: any) {
      // If the current node has resume_block = true and no children, update the result
      if (node.resume_block && node.type === 'vertical') {
        lastResumeBlock = node;
      }

      // Traverse the children
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    }

    // Start traversing from the root node
    traverse(courseData);

    return lastResumeBlock;
  }

  function getUnitToIframe(courseOutlineData: any) {
    //     decide if we have been given an explicit block to iframe
    const courseUrl = new URL(window.location.href);
    if (courseUrl.searchParams.has('unit_id')) {
      const unitId = courseUrl.search.match(/unit_id=([^&]*)/)?.[1];
      if (!unitId) {
        return getFirstAvailableUnit(courseOutlineData);
      }
      return findVerticalById(courseOutlineData, unitId);
    } else {
      let lastResumeBlock = findLastResumeBlock(courseOutlineData);

      if (lastResumeBlock) {
        return lastResumeBlock;
      }
    }

    return getFirstAvailableUnit(courseOutlineData);
  }

  async function addIframeUrl(course_id: string, xblockID: string, callback: any) {
    let url = '';
    let baseLMSIframeURL = `${config.urls.lms()}/xblock/${xblockID}?show_title=0&show_bookmark_button=1&recheck_access=1&view=student_view`;
    try {
      xblockID = xblockID.replace(/^\/|\/$/g, '');
      switch (xblockID) {
        case 'forum':
          url = `${config.urls.mfe()}/discussions/${course_id}/posts`;
          break;
        case 'notes':
          url = `${config.urls.mfe()}/courses/${course_id}/edxnotes`;
          break;
        case 'progress':
          url = `${config.urls.mfe()}/learning/course/${course_id}/progress/`;
          break;
        case 'dates':
          url = `${config.urls.mfe()}/learning/course/${course_id}/dates/`;
          break;
        case 'bookmarks':
          url = `${config.urls.legacyLmsUrl()}/courses/${course_id}/bookmarks/`;
          break;
        case 'gradebook':
          url = `${config.urls.mfe()}/gradebook/${course_id}/`;
          break;
        case 'instructor':
          baseLMSIframeURL = `${config.urls.lms()}/courses/${course_id}/instructor`;
        default:
          const { data: authSsoToken } = await getEdxSsoAuthToken({
            username: getUserName(),
            redirect_url: baseLMSIframeURL,
          });
          url = `${config.urls.legacyLmsUrl()}/ibl/ai/sso/backend/edx/iframe?sso_auth_token=${
            authSsoToken?.sso_auth_token
          }`;
          break;
      }
      callback(url);
    } catch (error) {
      callback(url);
    }
  }

  function findVerticalById(data: any, verticalId: string) {
    // Define a recursive helper function to search through the data
    function search(data: any) {
      for (const item of data) {
        if (item.id === verticalId) {
          return item;
        }
        if (item.children) {
          const result: any = search(item.children);
          if (result) {
            return result;
          }
        }
      }
      return null;
    }

    // Call the helper function starting from the top level
    return search(data.children);
  }

  const getParentBlockById = (blocksArray: any, targetBlockId: string) => {
    let foundIndices: any[] = [];

    const findParentBlock = (currentBlock: any, targetBlockId: string, currentIndices: any[]) => {
      if (currentBlock.id === targetBlockId) {
        foundIndices = currentIndices.slice(); // Copy the current indices
        return currentBlock;
      }

      if (currentBlock.children) {
        for (let i = 0; i < currentBlock.children.length; i++) {
          const childBlock = currentBlock.children[i];
          const result: any = findParentBlock(childBlock, targetBlockId, [...currentIndices, i]);
          if (result) {
            return result;
          }
        }
      }

      return null;
    };

    for (let i = 0; i < blocksArray.length; i++) {
      const rootBlock = blocksArray[i];
      const parentBlock = findParentBlock(rootBlock, targetBlockId, [i]);
      if (parentBlock) {
        return { parentBlock, foundIndices };
      }
    }

    return { parentBlock: null, foundIndices };
  };

  function getPreviousUnitIframe(suppliedId: string, courseData: any) {
    let idList = flattenVerticalBlocks(courseData);
    const index = idList.findIndex((item) => {
      return item.id === suppliedId;
    });

    if (index === -1 || index === 0) {
      // If the suppliedId is not found or it's the first element, return null
      return null;
    }

    return idList[index - 1].id;
  }

  function getNextUnitIframe(suppliedId: string, courseData: any) {
    let idList = flattenVerticalBlocks(courseData);
    const index = idList.findIndex((item) => item.id === suppliedId);

    if (index === -1 || index === idList.length - 1) {
      // If the suppliedId is not found or it's the last element, return null
      return null;
    }

    return idList[index + 1].id;
  }

  function addBookmarksTab(tabs: any, course_id: string) {
    const newTab = {
      tab_id: 'bookmarks',
      title: 'Bookmarks',
      url: `${process.env.REACT_APP_IBL_LMS_URL}/courses/${course_id}/bookmarks`,
    };
    tabs.push(newTab);
  }

  /**
   * Finds the parent module (1st level) and lesson (2nd level) ids from a sublesson (3rd level) id.
   * @param modules - array of modules (courseOutline or courseModules)
   * @param sublessonId - id of the sublesson to search for
   * @returns an object with moduleId and lessonId, or undefined if not found
   */
  function getParentsInfosFromSublessonId(
    modules: any[],
    sublessonId: string,
  ): { module: Record<string, any>; lesson: Record<string, any> } | undefined {
    try {
      for (const module of modules) {
        if (!module.children) continue;
        for (const lesson of module.children) {
          if (!lesson.children) continue;
          for (const sublesson of lesson.children) {
            if (sublesson.id === sublessonId) {
              return { module, lesson };
            }
          }
        }
      }
      throw new Error('Sublesson not found');
    } catch (error) {
      return {
        module: {},
        lesson: {},
      };
    }
  }

  return {
    getIframeURL,
    getUnitToIframe,
    findSequentialParent,
    flattenVerticalBlocks,
    getFirstAvailableUnit,
    findLastResumeBlock,
    getParentBlockById,
    getPreviousUnitIframe,
    getNextUnitIframe,
    addBookmarksTab,
    getParentsInfosFromSublessonId,
  };
};
