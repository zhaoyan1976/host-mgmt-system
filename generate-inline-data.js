const fs = require('fs');

// 读取原始数据
const data = JSON.parse(fs.readFileSync('functions/api/data/initial_hosts.json', 'utf8'));

// 生成内联的JavaScript数组
const generateInlineData = (data) => {
  let result = 'const initial = [\n';

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    result += '  {\n';
    result += `    "运行 状态": "${item["运行 状态"]}",\n`;
    result += `    "主机公网IP 【必填】": "${item["主机公网IP 【必填】"]}",\n`;
    result += `    "第一联系人姓名 【必填】": "${item["第一联系人姓名 【必填】"]}",\n`;
    result += `    "第一联系人邮箱 【必填】": "${item["第一联系人邮箱 【必填】"]}",\n`;
    result += `    "用户单位名称 【必填】": "${item["用户单位名称 【必填】"]}",\n`;
    result += `    "客户经理": "${item["客户经理"] || ""}"\n`;
    result += '  }';

    if (i < data.length - 1) {
      result += ',';
    }
    result += '\n';
  }

  result += '];';
  return result;
};

// 生成代码
const inlineData = generateInlineData(data);

// 读取现有的hosts.js文件
let hostsJs = fs.readFileSync('functions/api/hosts.js', 'utf8');

// 替换数据部分
const dataStart = '// 直接使用内联的完整数据（从 initial_hosts.json 复制）\n      // 注意：由于 Cloudflare Functions 可能无法访问外部 URL，这里直接内联数据\n      const initial = [';
const dataEnd = '      ];';

// 找到数据部分的开始和结束位置
const startIndex = hostsJs.indexOf(dataStart);
const endIndex = hostsJs.indexOf(dataEnd, startIndex) + dataEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  // 替换数据部分
  const before = hostsJs.substring(0, startIndex);
  const after = hostsJs.substring(endIndex);

  hostsJs = before + inlineData + after;

  // 写回文件
  fs.writeFileSync('functions/api/hosts.js', hostsJs);
  console.log('成功更新 hosts.js 文件，包含了所有数据记录');
} else {
  console.log('未找到数据部分，无法替换');
}
