import { useState, useEffect } from 'react'
import { 
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Stack,
  Grid,
  MenuItem,
  IconButton,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { translations, getLanguage } from '../locales/translations'

interface Parameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'object' | 'array';
  properties?: Parameter[];  // 子参数列表
  items?: Parameter;  // 新增 items 字段用于 array 类型
}

interface ApiInterface {
  name: string;
  description: string;
  parameters: Parameter[];
  response: Parameter[];
}

export default function Home() {
  const [apiInterface, setApiInterface] = useState<ApiInterface>({
    name: '',
    description: '',
    parameters: [{ name: '', description: '', type: 'string', properties: [] }],
    response: [{ name: '', description: '', type: 'string', properties: [] }]
  })

  const [generatedJson, setGeneratedJson] = useState<string>('')
  const [expandedRows, setExpandedRows] = useState<{[key: string]: boolean}>({})
  const [expandedParams, setExpandedParams] = useState<{[key: string]: boolean}>({})
  const [parametersKey, setParametersKey] = useState<'parameters' | 'arguments'>('parameters')
  const [responseKey, setResponseKey] = useState<'response' | 'result' | 'return' | 'returnValue'>('response')
  const [errors, setErrors] = useState<{[key: string]: boolean}>({})
  const [lang, setLang] = useState<'en' | 'zh'>('en')
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    setLang(getLanguage())
  }, [])

  const t = translations[lang]

  const toggleExpand = (key: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleParamExpand = (paramPath: string) => {
    setExpandedParams(prev => ({
      ...prev,
      [paramPath]: prev[paramPath] === undefined ? false : !prev[paramPath]
    }))
  }

  // 递归处理参数对象
  const processParameter = (param: Parameter): any => {
    // 如果参数没有名称，返回 null
    if (!param.name.trim()) {
      return null;
    }
    // 如果有描述但没有名称，返回 null
    if (param.description.trim() && !param.name.trim()) {
      return null;
    }

    const result: { [key: string]: any } = {
      type: param.type,
    };
    
    if (param.description.trim()) {
      result.description = param.description;
    }

    if (param.type === 'object' && param.properties) {
      // 如果是对象类型且有子属性，必须有名称
      if (!param.name.trim()) {
        return null;
      }
      
      const properties = param.properties.reduce((acc: { [key: string]: any }, prop) => {
        const processed = processParameter(prop);
        if (processed !== null) {
          acc[prop.name] = processed;
        }
        return acc;
      }, {});
      
      // 只有当有有效的子属性时才添加 properties
      if (Object.keys(properties).length > 0) {
        result.properties = properties;
      }
    }

    if (param.type === 'array' && param.items) {
      const processedItems = processParameter(param.items);
      if (processedItems !== null) {
        result.items = processedItems;
      }
    }

    return result;
  };

  // 递归检查参数的有效性
  const validateParameter = (param: Parameter, path: string) => {
    let hasError = false;

    // 检查有描述但没有名称的情况
    if (param.description.trim() && !param.name.trim()) {
      setErrors(prev => ({ ...prev, [`${path}-name`]: true }));
      hasError = true;
    }

    // 检查对象类型且有子属性但没有名称的情况
    if (param.type === 'object' && param.properties && param.properties.length > 0 && !param.name.trim()) {
      setErrors(prev => ({ ...prev, [`${path}-name`]: true }));
      hasError = true;
    }

    // 递归检查子属性
    if (param.type === 'object' && param.properties) {
      param.properties.forEach((prop, index) => {
        if (validateParameter(prop, `${path}-${index}`)) {
          hasError = true;
        }
      });
    }

    // 检查数组的 items
    if (param.type === 'array' && param.items) {
      if (validateParameter(param.items, `${path}-items`)) {
        hasError = true;
      }
    }

    return hasError;
  };

  const generateJson = () => {
    // 清除之前的错误
    setErrors({});
    let hasError = false;

    // 检查接口名称和描述
    if (!apiInterface.name.trim()) {
      setErrors(prev => ({ ...prev, 'interface-name': true }));
      hasError = true;
    }
    if (!apiInterface.description.trim()) {
      setErrors(prev => ({ ...prev, 'interface-description': true }));
      hasError = true;
    }

    // 检查参数列表
    apiInterface.parameters.forEach((param, index) => {
      if (validateParameter(param, `parameter-${index}`)) {
        hasError = true;
      }
    });

    // 检查返回值列表
    apiInterface.response.forEach((ret, index) => {
      if (validateParameter(ret, `returnValue-${index}`)) {
        hasError = true;
      }
    });

    if (hasError) {
      return;
    }

    // 构建参数对象
    const parameters = apiInterface.parameters.reduce((acc: { [key: string]: any }, param) => {
      const processed = processParameter(param);
      if (processed !== null) {
        acc[param.name] = processed;
      }
      return acc;
    }, {});

    // 构建返回值对象
    const response = apiInterface.response.reduce((acc: { [key: string]: any }, ret) => {
      const processed = processParameter(ret);
      if (processed !== null) {
        acc[ret.name] = processed;
      }
      return acc;
    }, {});

    // 构建最终的JSON对象
    const jsonOutput: { [key: string]: any } = {
      name: apiInterface.name,
      description: apiInterface.description,
    };

    // 只有当有有效的参数时才添加参数对象
    if (Object.keys(parameters).length > 0) {
      jsonOutput[parametersKey] = parameters;
    }

    // 只有当有有效的返回值时才添加返回值对象
    if (Object.keys(response).length > 0) {
      jsonOutput[responseKey] = response;
    }

    setGeneratedJson(JSON.stringify(jsonOutput, null, 2));
  };

  const addParameter = () => {
    setApiInterface(prev => ({
      ...prev,
      parameters: [...prev.parameters, { name: '', description: '', type: 'string', properties: [] }]
    }))
  }

  const addReturnValue = () => {
    setApiInterface(prev => ({
      ...prev,
      response: [...prev.response, { name: '', description: '', type: 'string', properties: [] }]
    }))
  }

  const addSubParameter = (
    parameterIndex: number,
    parentType: 'parameter' | 'returnValue',
    parentPath: (number | 'items')[] = []
  ) => {
    setApiInterface(prev => {
      if (parentType === 'parameter') {
        const newParameters = [...prev.parameters];
        let currentParam = newParameters[parameterIndex];
        
        // 找到要添加属性的父级
        for (const pathSegment of parentPath) {
          if (pathSegment === 'items' && currentParam.type === 'array') {
            if (!currentParam.items) {
              currentParam.items = { name: 'items', description: '', type: 'string' };
            }
            currentParam = currentParam.items;
          } else if (typeof pathSegment === 'number') {
            if (!currentParam.properties || !currentParam.properties[pathSegment]) return prev;
            currentParam = currentParam.properties[pathSegment];
          }
        }
        
        if (!currentParam.properties) {
          currentParam.properties = [];
        }
        
        currentParam.properties.push({
          name: '',
          description: '',
          type: 'string'
        });
        
        return { ...prev, parameters: newParameters };
      } else {
        const newResponse = [...prev.response];
        let currentRet = newResponse[parameterIndex];
        
        // 找到要添加属性的父级
        for (const pathSegment of parentPath) {
          if (pathSegment === 'items' && currentRet.type === 'array') {
            if (!currentRet.items) {
              currentRet.items = { name: 'items', description: '', type: 'string' };
            }
            currentRet = currentRet.items;
          } else if (typeof pathSegment === 'number') {
            if (!currentRet.properties || !currentRet.properties[pathSegment]) return prev;
            currentRet = currentRet.properties[pathSegment];
          }
        }
        
        if (!currentRet.properties) {
          currentRet.properties = [];
        }
        
        currentRet.properties.push({
          name: '',
          description: '',
          type: 'string'
        });
        
        return { ...prev, response: newResponse };
      }
    });
  };

  const updateParameter = (index: number, field: keyof Parameter, value: string) => {
    setApiInterface(prev => ({
      ...prev,
      parameters: prev.parameters.map((param, i) => {
        if (i !== index) return param;
        const updatedParam = { ...param, [field]: value };
        // 如果类型改为 object，添加一个默认的空属性
        if (field === 'type' && value === 'object') {
          updatedParam.properties = [{ name: '', description: '', type: 'string' }];
          setExpandedParams(prev => ({
            ...prev,
            [`parameter-${index}`]: true
          }));
        }
        // 如果类型改为 array，添加一个默认的 items
        if (field === 'type' && value === 'array') {
          updatedParam.items = { name: 'items', description: '', type: 'string' };
        }
        return updatedParam;
      })
    }))
  }

  const updateReturnValue = (index: number, field: keyof Parameter, value: string) => {
    setApiInterface(prev => ({
      ...prev,
      response: prev.response.map((ret, i) => {
        if (i !== index) return ret;
        const updatedRet = { ...ret, [field]: value };
        // 如果类型改为 object，添加一个默认的空属性
        if (field === 'type' && value === 'object') {
          updatedRet.properties = [{ name: '', description: '', type: 'string' }];
          setExpandedParams(prev => ({
            ...prev,
            [`returnValue-${index}`]: true
          }));
        }
        // 如果类型改为 array，添加一个默认的 items
        if (field === 'type' && value === 'array') {
          updatedRet.items = { name: 'items', description: '', type: 'string' };
        }
        return updatedRet;
      })
    }))
  }

  const updateSubParameter = (
    parameterIndex: number,
    subParameterPath: (number | string)[],
    field: keyof Parameter,
    value: string,
    parentType: 'parameter' | 'returnValue',
    isArrayItem: boolean = false
  ) => {
    setApiInterface(prev => {
      if (parentType === 'parameter') {
        const newParameters = [...prev.parameters];
        let currentParam = newParameters[parameterIndex];
        
        // 遍历路径找到目标属性
        for (let i = 0; i <subParameterPath.length; i++) {
          const pathSegment = subParameterPath[i];
          if (pathSegment === 'items') {
            if (currentParam.type === 'array') {
              if (!currentParam.items) {
                currentParam.items = { name: 'items', description: '', type: 'string' };
              }
              if (i === subParameterPath.length - 1) {
                // 更新 items 本身
                if (field === 'name' && currentParam.items.name === 'items') {
                  // 不允许修改 items 的名称
                  return prev;
                }
                (currentParam.items as any)[field] = value;
                // 如果类型改为 object，添加一个默认的空属性
                if (field === 'type' && value === 'object' && (!currentParam.items.properties || currentParam.items.properties.length === 0)) {
                  currentParam.items.properties = [{ name: '', description: '', type: 'string' }];
                }
                // 如果类型改为 array，添加一个默认的 items
                if (field === 'type' && value === 'array' && !currentParam.items.items) {
                  currentParam.items.items = { name: 'items', description: '', type: 'string' };
                }
              } else {
                currentParam = currentParam.items;
              }
            }
          } else if (typeof pathSegment === 'number') {
            if (currentParam.properties && currentParam.properties[pathSegment]) {
              if (i === subParameterPath.length - 1) {
                // 更新属性
                const updatedParam = {
                  ...currentParam.properties[pathSegment],
                  [field]: value
                };
                
                // 如果类型改为 object，添加一个默认的空属性
                if (field === 'type' && value === 'object' && (!updatedParam.properties || updatedParam.properties.length === 0)) {
                  updatedParam.properties = [{ name: '', description: '', type: 'string' }];
                }
                // 如果类型改为 array，添加一个默认的 items
                if (field === 'type' && value === 'array' && !updatedParam.items) {
                  updatedParam.items = { name: 'items', description: '', type: 'string' };
                }
                
                currentParam.properties[pathSegment] = updatedParam;
              } else {
                currentParam = currentParam.properties[pathSegment];
              }
            }
          }
        }
        
        return { ...prev, parameters: newParameters };
      } else {
        const newResponse = [...prev.response];
        let currentRet = newResponse[parameterIndex];
        
        // 遍历路径找到目标属性
        for (let i = 0; i < subParameterPath.length; i++) {
          const pathSegment = subParameterPath[i];
          if (pathSegment === 'items') {
            if (currentRet.type === 'array') {
              if (!currentRet.items) {
                currentRet.items = { name: 'items', description: '', type: 'string' };
              }
              if (i === subParameterPath.length - 1) {
                // 更新 items 本身
                if (field === 'name' && currentRet.items.name === 'items') {
                  // 不允许修改 items 的名称
                  return prev;
                }
                (currentRet.items as any)[field] = value;
                // 如果类型改为 object，添加一个默认的空属性
                if (field === 'type' && value === 'object' && (!currentRet.items.properties || currentRet.items.properties.length === 0)) {
                  currentRet.items.properties = [{ name: '', description: '', type: 'string' }];
                }
                // 如果类型改为 array，添加一个默认的 items
                if (field === 'type' && value === 'array' && !currentRet.items.items) {
                  currentRet.items.items = { name: 'items', description: '', type: 'string' };
                }
              } else {
                currentRet = currentRet.items;
              }
            }
          } else if (typeof pathSegment === 'number') {
            if (currentRet.properties && currentRet.properties[pathSegment]) {
              if (i === subParameterPath.length - 1) {
                // 更新属性
                const updatedParam = {
                  ...currentRet.properties[pathSegment],
                  [field]: value
                };
                
                // 如果类型改为 object，添加一个默认的空属性
                if (field === 'type' && value === 'object' && (!updatedParam.properties || updatedParam.properties.length === 0)) {
                  updatedParam.properties = [{ name: '', description: '', type: 'string' }];
                }
                // 如果类型改为 array，添加一个默认的 items
                if (field === 'type' && value === 'array' && !updatedParam.items) {
                  updatedParam.items = { name: 'items', description: '', type: 'string' };
                }
                
                currentRet.properties[pathSegment] = updatedParam;
              } else {
                currentRet = currentRet.properties[pathSegment];
              }
            }
          }
        }
        
        return { ...prev, response: newResponse };
      }
    });
  };

  const deleteSubParameter = (
    parameterIndex: number,
    subParameterPath: (number | 'items')[],
    parentType: 'parameter' | 'returnValue'
  ) => {
    // 不允许删除 items 本身
    if (subParameterPath[subParameterPath.length - 1] === 'items') {
      return;
    }

    setApiInterface(prev => {
      if (parentType === 'parameter') {
        const newParameters = [...prev.parameters];
        let currentParam = newParameters[parameterIndex];
        
        // 遍历路径找到要删除的属性所在的数组
        for (let i = 0; i < subParameterPath.length - 1; i++) {
          const pathSegment = subParameterPath[i];
          if (pathSegment === 'items') {
            if (!currentParam.items) return prev;
            currentParam = currentParam.items;
          } else if (typeof pathSegment === 'number') {
            if (!currentParam.properties || !currentParam.properties[pathSegment]) return prev;
            currentParam = currentParam.properties[pathSegment];
          }
        }
        
        // 确定要删除属性的位置
        const lastSegment = subParameterPath[subParameterPath.length - 1];
        if (typeof lastSegment === 'number') {
          if (currentParam.properties) {
            currentParam.properties = currentParam.properties.filter((_, index) => index !== lastSegment);
          }
        }
        
        return { ...prev, parameters: newParameters };
      } else {
        const newResponse = [...prev.response];
        let currentRet = newResponse[parameterIndex];
        
        // 遍历路径找到要删除的属性所在的数组
        for (let i = 0; i < subParameterPath.length - 1; i++) {
          const pathSegment = subParameterPath[i];
          if (pathSegment === 'items') {
            if (!currentRet.items) return prev;
            currentRet = currentRet.items;
          } else if (typeof pathSegment === 'number') {
            if (!currentRet.properties || !currentRet.properties[pathSegment]) return prev;
            currentRet = currentRet.properties[pathSegment];
          }
        }

        // 确定要删除属性的位置
        const lastSegment = subParameterPath[subParameterPath.length - 1];
        if (typeof lastSegment === 'number') {
          if (currentRet.properties) {
            currentRet.properties = currentRet.properties.filter((_, index) => index !== lastSegment);
          }
        }
        
        return { ...prev, response: newResponse };
      }
    });
  };

  const renderArrayItems = (
    parameter: Parameter,
    parameterIndex: number,
    parentType: 'parameter' | 'returnValue',
    parentPath: (number | 'items')[] = []
  ) => {
    if (!parameter.items) {
      parameter.items = { name: 'items', description: '', type: 'string' };
    }

    return (
      <Box sx={{ pl: 4, pt: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={4}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              label="items"
              value="items"
              disabled
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              label={t.propertyDescription}
              value={parameter.items.description || ''}
              onChange={(e) => {
                const newPath = [...parentPath, 'items'];
                updateSubParameter(
                  parameterIndex,
                  newPath,
                  'description',
                  e.target.value,
                  parentType,
                  true
                );
              }}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              select
              label={t.propertyType}
              value={parameter.items.type || 'string'}
              onChange={(e) => {
                const newPath = [...parentPath, 'items'];
                updateSubParameter(
                  parameterIndex,
                  newPath,
                  'type',
                  e.target.value as any,
                  parentType,
                  true
                );
              }}
            >
              {['string', 'number', 'object', 'array'].map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        {parameter.items.type === 'object' && (
          <Box>
            {renderSubParameters(parameter.items, parameterIndex, parentType, [...parentPath, 'items'])}
          </Box>
        )}
        {parameter.items.type === 'array' && (
          <Box>
            {renderArrayItems(parameter.items, parameterIndex, parentType, [...parentPath, 'items'])}
          </Box>
        )}
      </Box>
    );
  };

  const renderSubParameters = (
    parameter: Parameter,
    parameterIndex: number,
    parentType: 'parameter' | 'returnValue',
    parentPath: (number | 'items')[] = []
  ) => {
    if (parameter.type === 'array') {
      return renderArrayItems(parameter, parameterIndex, parentType, parentPath);
    }

    if (parameter.type !== 'object' || !parameter.properties) {
      return null;
    }

    const paramPath = `${parentType}-${parameterIndex}-${parentPath.join('-')}`
    const isExpanded = expandedParams[paramPath] === true // 默认收起

    return (
      <Box sx={{ pl: 4, pt: 2, mb: 2 }}>
        {parameter.properties.map((subParam, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  label={parentType === 'parameter' ? t.parameterName : t.returnValueName}
                  value={subParam.name}
                  onChange={(e) => updateSubParameter(parameterIndex, [...parentPath, index], 'name', e.target.value, parentType)}
                  error={errors[`${paramPath}-${index}-name`]}
                  helperText={errors[`${paramPath}-${index}-name`] ? t.nameRequired : ''}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  label={t.propertyDescription}
                  value={subParam.description}
                  onChange={(e) => updateSubParameter(parameterIndex, [...parentPath, index], 'description', e.target.value, parentType)}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  select
                  label={t.propertyType}
                  value={subParam.type}
                  onChange={(e) => updateSubParameter(parameterIndex, [...parentPath, index], 'type', e.target.value as any, parentType)}
                >
                  {['string', 'number', 'object', 'array'].map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                {subParam.type === 'object' && (
                  <IconButton
                    size="small"
                    onClick={() => toggleParamExpand(`${paramPath}-${index}`)}
                  >
                    {expandedParams[`${paramPath}-${index}`] === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                )}
                <IconButton
                  onClick={() => deleteSubParameter(parameterIndex, [...parentPath, index], parentType)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
            {subParam.type === 'object' && expandedParams[`${paramPath}-${index}`] === true && (
              renderSubParameters(subParam, parameterIndex, parentType, [...parentPath, index])
            )}
            {subParam.type === 'array' && (
              renderArrayItems(subParam, parameterIndex, parentType, [...parentPath, index])
            )}
          </Box>
        ))}
        <Button
          startIcon={<AddIcon />}
          onClick={() => addSubParameter(parameterIndex, parentType, parentPath)}
          size="small"
          variant="contained"
          sx={{ mt: 2, fontSize: '0.875rem' }}
        >
          {t.addProperty}
        </Button>
      </Box>
    );
  };

  const deleteParameter = (index: number) => {
    setApiInterface(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }))
  }

  const deleteReturnValue = (index: number) => {
    setApiInterface(prev => ({
      ...prev,
      response: prev.response.filter((_, i) => i !== index)
    }))
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedJson)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 1 }}>
          {t.title}
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          {t.description}
        </Typography>
        <Stack spacing={4}>
          {/* 接口信息 */}
          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>{t.interfaceInfo}</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  label={t.interfaceName}
                  value={apiInterface.name}
                  onChange={(e) => setApiInterface(prev => ({ ...prev, name: e.target.value }))}
                  error={errors['interface-name']}
                  helperText={errors['interface-name'] ? t.nameRequired : ''}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  label={t.interfaceDescription}
                  value={apiInterface.description}
                  onChange={(e) => setApiInterface(prev => ({ ...prev, description: e.target.value }))}
                  error={errors['interface-description']}
                  helperText={errors['interface-description'] ? t.descriptionRequired : ''}
                />
              </Grid>
            </Grid>
          </Box>

          {/* 参数列表 */}
          <Box>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item>
                <Typography variant="h5">{t.parameterList}</Typography>
              </Grid>
              <Grid item>
                <TextField
                  select
                  size="small"
                  value={parametersKey}
                  onChange={(e) => setParametersKey(e.target.value as 'parameters' | 'arguments')}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="parameters">parameters</MenuItem>
                  <MenuItem value="arguments">arguments</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Stack spacing={2}>
              {apiInterface.parameters.map((param, index) => (
                <Box key={index}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        label={t.parameterName}
                        value={param.name}
                        onChange={(e) => updateParameter(index, 'name', e.target.value)}
                        error={errors[`parameter-${index}-name`]}
                        helperText={errors[`parameter-${index}-name`] ? t.nameRequired : ''}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        label={t.parameterDescription}
                        value={param.description}
                        onChange={(e) => updateParameter(index, 'description', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        select
                        label={t.propertyType}
                        value={param.type}
                        onChange={(e) => updateParameter(index, 'type', e.target.value as any)}
                      >
                        {['string', 'number', 'object', 'array'].map((type) => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      {param.type === 'object' && (
                        <IconButton
                          size="small"
                          onClick={() => toggleParamExpand(`parameter-${index}`)}
                        >
                          {expandedParams[`parameter-${index}`] === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      )}
                      <IconButton
                        onClick={() => deleteParameter(index)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                  {param.type === 'object' && expandedParams[`parameter-${index}`] === true && (
                    <Box>
                      {renderSubParameters(param, index, 'parameter')}
                    </Box>
                  )}
                  {param.type === 'array' && (
                    <Box>
                      {renderArrayItems(param, index, 'parameter')}
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={addParameter} 
                size="small"
                sx={{ fontSize: '0.875rem' }}
              >
                {t.addParameter}
              </Button>
            </Box>
          </Box>

          {/* 返回值列表 */}
          <Box>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item>
                <Typography variant="h5">{t.returnValueList}</Typography>
              </Grid>
              <Grid item>
                <TextField
                  select
                  size="small"
                  value={responseKey}
                  onChange={(e) => setResponseKey(e.target.value as 'response' | 'result' | 'return' | 'returnValue')}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="response">response</MenuItem>
                  <MenuItem value="result">result</MenuItem>
                  <MenuItem value="return">return</MenuItem>
                  <MenuItem value="returnValue">returnValue</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Stack spacing={2}>
              {apiInterface.response.map((ret, index) => (
                <Box key={index}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        label={t.returnValueName}
                        value={ret.name}
                        onChange={(e) => updateReturnValue(index, 'name', e.target.value)}
                        error={errors[`returnValue-${index}-name`]}
                        helperText={errors[`returnValue-${index}-name`] ? t.nameRequired : ''}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        label={t.returnValueDescription}
                        value={ret.description}
                        onChange={(e) => updateReturnValue(index, 'description', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        select
                        label={t.propertyType}
                        value={ret.type}
                        onChange={(e) => updateReturnValue(index, 'type', e.target.value as any)}
                      >
                        {['string', 'number', 'object', 'array'].map((type) => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      {ret.type === 'object' && (
                        <IconButton
                          size="small"
                          onClick={() => toggleParamExpand(`returnValue-${index}`)}
                        >
                          {expandedParams[`returnValue-${index}`] === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      )}
                      <IconButton
                        onClick={() => deleteReturnValue(index)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                  {ret.type === 'object' && expandedParams[`returnValue-${index}`] === true && (
                    <Box>
                      {renderSubParameters(ret, index, 'returnValue')}
                    </Box>
                  )}
                  {ret.type === 'array' && (
                    <Box>
                      {renderArrayItems(ret, index, 'returnValue')}
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={addReturnValue}
                size="small"
                sx={{ fontSize: '0.875rem' }}
              >
                {t.addReturnValue}
              </Button>
            </Box>
          </Box>

          {/* 生成JSON按钮和展示区域 */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button 
                variant="contained" 
                onClick={generateJson}
                size="small"
              >
                {t.generateJson}
              </Button>
            </Box>
            {generatedJson && (
              <Paper 
                elevation={0} 
                variant="outlined"
                sx={{ 
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  maxHeight: '400px',
                  overflow: 'auto',
                  position: 'relative'
                }}
              >
                <IconButton
                  onClick={handleCopy}
                  size="small"
                  color={copySuccess ? "success" : "default"}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                  {generatedJson}
                </pre>
              </Paper>
            )}
          </Box>
        </Stack>
      </Paper>
    </Container>
  )
}
