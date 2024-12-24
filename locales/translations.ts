interface Translations {
  [key: string]: {
    title: string;
    description: string;
    keywords: string;
    interfaceInfo: string;
    interfaceName: string;
    interfaceDescription: string;
    parameterList: string;
    parameterName: string;
    parameterDescription: string;
    parameterType: string;
    addParameter: string;
    propertyName: string;
    propertyDescription: string;
    propertyType: string;
    addProperty: string;
    returnValueList: string;
    returnValueName: string;
    returnValueDescription: string;
    returnValueType: string;
    addReturnValue: string;
    generateJson: string;
    nameRequired: string;
    descriptionRequired: string;
  };
}

export const translations: Translations = {
  en: {
    title: 'AI Function Calling Generator',
    description: 'Generate structured interface descriptions for ChatGPT Function Calling and MCP protocols',
    keywords: 'AI,ChatGPT,Function Calling,Interface Generator,MCP Protocol,JSON Generator',
    interfaceInfo: 'Interface Information',
    interfaceName: 'Interface Name',
    interfaceDescription: 'Interface Description',
    parameterList: 'Parameter List',
    parameterName: 'Parameter Name',
    parameterDescription: 'Parameter Description',
    parameterType: 'Parameter Type',
    addParameter: 'Add Parameter',
    propertyName: 'Property Name',
    propertyDescription: 'Property Description',
    propertyType: 'Property Type',
    addProperty: 'Add Property',
    returnValueList: 'Return Value List',
    returnValueName: 'Return Value Name',
    returnValueDescription: 'Return Value Description',
    returnValueType: 'Return Value Type',
    addReturnValue: 'Add Return Value',
    generateJson: 'Generate JSON',
    nameRequired: 'Name is required',
    descriptionRequired: 'Description is required',
  },
  zh: {
    title: 'AI Function Calling 生成器',
    description: '为ChatGPT Function Calling和MCP协议生成结构化接口描述',
    keywords: 'AI,ChatGPT,Function Calling,接口生成器,MCP协议,JSON生成器',
    interfaceInfo: '接口信息',
    interfaceName: '接口名称',
    interfaceDescription: '接口描述',
    parameterList: '参数列表',
    parameterName: '参数名称',
    parameterDescription: '参数描述',
    parameterType: '参数类型',
    addParameter: '添加参数',
    propertyName: '属性名称',
    propertyDescription: '属性描述',
    propertyType: '属性类型',
    addProperty: '添加属性',
    returnValueList: '返回值列表',
    returnValueName: '返回值名称',
    returnValueDescription: '返回值描述',
    returnValueType: '返回值类型',
    addReturnValue: '添加返回值',
    generateJson: '生成JSON',
    nameRequired: '名称不能为空',
    descriptionRequired: '描述不能为空',
  }
};

export const getLanguage = (): 'en' | 'zh' => {
  if (typeof navigator === 'undefined') return 'en';
  
  const lang = navigator.language.toLowerCase();
  return lang.startsWith('zh') ? 'zh' : 'en';
};
